import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBoxOpen,
  FaCircleInfo,
  FaDownload,
  FaFileExcel,
  FaFloppyDisk,
  FaGripVertical,
  FaPen,
  FaPlus,
  FaRotateLeft,
  FaRotateRight,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import {
  ADMIN_TABLES,
  buildRecordFromForm,
  createEmptyRecord,
  getRecordId,
  getTableFields,
  getVisibleColumns,
  mergeSelectOptions,
  normalizeRecordForForm,
  searchTableRows,
} from "../../services/adminCrudService";
import { parseAccountImportFile } from "../../services/accountImportService";
import accountTemplateUrl from "../../assets/gift-account-template.xlsx?url";
import {
  confirmAdminAction,
  showAdminAlert,
} from "../../services/adminBrowserFeedback";
import { useAdminClientPagination } from "../../hooks/useAdminClientPagination";
import { AdminClientPagination } from "./AdminClientPagination";
import { AdminCustomerTablePanel } from "./AdminCustomerTablePanel";
import { AdminEggTablePanel } from "./AdminEggTablePanel";
import { AdminGiftPoolDragPanel } from "./AdminGiftPoolDragPanel";
import { AdminModalPortal } from "./AdminModalPortal";
import { AdminGiftPoolTablePanel } from "./AdminGiftPoolTablePanel";
import { AdminPageGuide } from "./AdminPageGuide";
import { AdminProductTablePanel } from "./AdminProductTablePanel";
import {
  CUSTOMER_STATUS,
  getCustomerStatusLabel,
} from "../../utils/customerStatus";

const EMPTY_ROWS = [];
const ALWAYS_VISIBLE_TABLE_KEYS = new Set([
  "giftAccounts",
  "giftPools",
  "poolAccountMappings",
  "productEggMappings",
  "customers",
  "eggs",
  "products",
  "adminOrders",
]);
const DEFAULT_TABLE_KEY = "giftAccounts";
const PRIORITY_COLUMNS_BY_TABLE = {
  giftAccounts: ["username", "password", "tier", "platform", "status"],
  customers: [
    "customerCode",
    "customerName",
    "status",
    "successCount",
    "returnCount",
    "warningCount",
    "unbanAt",
  ],
  eggs: ["egg_type", "status", "hatch_at", "order_id", "account_id"],
  giftPools: ["pool_name", "tier", "created_at"],
  adminOrders: ["order_code", "status", "fulfillment_status", "delivered_at", "last_synced_at"],
  poolAccountMappings: ["pool_id", "account_id"],
  productEggMappings: ["kv_product_id", "egg_type", "gift_pool_id", "egg_tier"],
  products: ["kvProductId", "name", "basePrice", "lastSyncedAt"],
};

const ACCOUNT_TABLE_COLUMNS = [
  "username",
  "password",
  "platform",
  "tier",
  "status",
  "token",
  "assigned_at",
];

const ACCOUNT_FORM_FIELD_ORDER = [
  "username",
  "password",
  "platform",
  "tier",
  "status",
  "token",
];
const ACCOUNT_DEFAULT_PAGE_SIZE = 100;

const BOARD_CONFIG_BY_TABLE = {
  giftAccounts: {
    field: "status",
    fallbackValue: "available",
    values: ["available", "assigned", "reserved", "used"],
  },
  customers: {
    field: "status",
    fallbackValue: CUSTOMER_STATUS.NORMAL,
    values: [
      CUSTOMER_STATUS.NORMAL,
      CUSTOMER_STATUS.WARNING,
      CUSTOMER_STATUS.TEMP_BANNED,
      CUSTOMER_STATUS.BANNED,
    ],
  },
  eggs: {
    field: "status",
    fallbackValue: "pending",
    values: ["pending", "claimed", "cancelled", "incubating", "ready", "locked"],
  },
  productEggMappings: {
    field: "egg_type",
    fallbackValue: 1,
    values: [1, 2],
  },
  products: {
    field: "__mappingStatus",
    fallbackValue: "unmapped",
    readOnly: true,
    values: ["mapped", "unmapped"],
  },
  adminOrders: {
    field: "status",
    fallbackValue: "Pending",
    values: ["Paid", "Pending", "Cancel"],
  },
};
const ACCOUNT_STATUS_RANK = new Map(
  BOARD_CONFIG_BY_TABLE.giftAccounts.values.map((status, index) => [
    status,
    index,
  ])
);

const PRODUCT_MAPPING_LABELS = {
  mapped: "Đã mapping",
  unmapped: "Chưa mapping",
};

function normalizeBoardValue(value) {
  return String(value ?? "").trim();
}

function normalizeComparableValue(value) {
  return normalizeBoardValue(value).toLowerCase();
}

function getAccountStatusRank(status) {
  const normalizedStatus = normalizeComparableValue(status);

  return ACCOUNT_STATUS_RANK.has(normalizedStatus)
    ? ACCOUNT_STATUS_RANK.get(normalizedStatus)
    : ACCOUNT_STATUS_RANK.size;
}

function getAccountTierValue(account) {
  return normalizeBoardValue(account?.tier).toUpperCase();
}

function getAssignedAtTimestamp(account) {
  const raw = account?.assigned_at;

  if (!raw) {
    return 0;
  }

  const ts = new Date(raw).getTime();

  return Number.isFinite(ts) ? ts : 0;
}

function sortGiftAccountRows(rows, lastChangedAccountId) {
  const lastChangedId = normalizeBoardValue(lastChangedAccountId);

  return [...rows].sort((first, second) => {
    const firstId = getRecordId(first, "giftAccounts");
    const secondId = getRecordId(second, "giftAccounts");

    // Acc vừa đổi trạng thái luôn lên đầu
    const recentDiff =
      Number(secondId === lastChangedId) - Number(firstId === lastChangedId);

    if (recentDiff) {
      return recentDiff;
    }

    // Sort theo ngày gán gần nhất (mới nhất lên đầu)
    const assignedDiff =
      getAssignedAtTimestamp(second) - getAssignedAtTimestamp(first);

    if (assignedDiff !== 0) {
      return assignedDiff;
    }

    // Tiebreaker: status rank → tier → username
    return (
      getAccountStatusRank(first.status) - getAccountStatusRank(second.status) ||
      getAccountTierValue(first).localeCompare(getAccountTierValue(second), "vi") ||
      normalizeBoardValue(first.username).localeCompare(
        normalizeBoardValue(second.username),
        "vi"
      )
    );
  });
}

function getProductComparableId(product) {
  return normalizeBoardValue(
    product?.kvProductId ||
      product?.kv_product_id ||
      product?.productId ||
      product?.id
  );
}

function getBoardConfig(tableKey) {
  return BOARD_CONFIG_BY_TABLE[tableKey] || {
    field: "id",
    fallbackValue: "records",
    readOnly: true,
    values: ["records"],
  };
}

function getBoardValue(tableKey, row, tables, config) {
  if (config.field === "__mappingStatus") {
    const productId = getProductComparableId(row);
    const hasMapping = (tables.productEggMappings || []).some(
      (mapping) => normalizeBoardValue(mapping.kv_product_id) === productId
    );

    return hasMapping ? "mapped" : "unmapped";
  }

  const rawValue = row?.[config.field];
  const normalizedValue = normalizeBoardValue(rawValue);

  if (!normalizedValue) {
    return config.fallbackValue;
  }

  return rawValue;
}

function getBoardValues(tableKey, rows, tables) {
  const config = getBoardConfig(tableKey);
  const values = new Map();

  (config.values || []).forEach((value) => {
    values.set(normalizeBoardValue(value), value);
  });

  rows.forEach((row) => {
    const value = getBoardValue(tableKey, row, tables, config);
    values.set(normalizeBoardValue(value), value);
  });

  if (!values.size) {
    values.set(normalizeBoardValue(config.fallbackValue), config.fallbackValue);
  }

  return [...values.values()];
}

function getOptionLabel(fields, fieldKey, value) {
  const field = fields.find((item) => item.key === fieldKey);
  const option = field?.options?.find(
    (item) => normalizeBoardValue(item.value) === normalizeBoardValue(value)
  );

  return option?.label || normalizeBoardValue(value) || "Chưa phân loại";
}

function getBoardLabel(tableKey, fields, config, value) {
  if (config.field === "__mappingStatus") {
    return PRODUCT_MAPPING_LABELS[value] || value;
  }

  if (tableKey === "customers") {
    return getCustomerStatusLabel(value);
  }

  return getOptionLabel(fields, config.field, value);
}

function getRecordCardTitle(tableKey, row, recordId) {
  if (tableKey === "giftAccounts") {
    return row.username || recordId;
  }

  if (tableKey === "customers") {
    return row.customerName || row.customerCode || recordId;
  }

  if (tableKey === "eggs") {
    return row.id || recordId;
  }

  if (tableKey === "productEggMappings") {
    return `${row.kv_product_id || "product"} -> ${row.gift_pool_id || "pool"}`;
  }

  if (tableKey === "products") {
    return row.name || row.fullName || row.id || recordId;
  }

  if (tableKey === "adminOrders") {
    return row.order_code || recordId;
  }

  return recordId || "Bản ghi";
}

function getRecordCardFields(tableKey, row, fields, boardField) {
  const priorityColumns = PRIORITY_COLUMNS_BY_TABLE[tableKey] || getVisibleColumns([row]);

  return priorityColumns
    .filter((key) => key !== boardField)
    .map((key) => ({
      key,
      label: getColumnLabel(fields, key),
      value: row[key],
    }))
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== "")
    .slice(0, 4);
}
function getPriorityColumns(tableKey, rows, fields) {
  const preferredColumns = PRIORITY_COLUMNS_BY_TABLE[tableKey] || [];

  if (!preferredColumns.length) {
    return getVisibleColumns(rows);
  }

  const configuredKeys = new Set(fields.map((field) => field.key));
  const rowKeys = new Set();

  rows.slice(0, 12).forEach((row) => {
    Object.keys(row).forEach((key) => rowKeys.add(key));
  });

  const availableKeys = rowKeys.size ? rowKeys : configuredKeys;
  const columns = preferredColumns.filter((key) => availableKeys.has(key));

  return columns.length ? columns : getVisibleColumns(rows);
}

function getColumnLabel(fields, column) {
  return fields.find((field) => field.key === column)?.label || column;
}

function getFieldOptions(fields, fieldKey) {
  return fields.find((field) => field.key === fieldKey)?.options || [];
}

function getRowStatusOptions(fields, status) {
  const options = getFieldOptions(fields, "status");
  const normalizedStatus = normalizeBoardValue(status);

  if (
    !normalizedStatus ||
    options.some(
      (option) => normalizeBoardValue(option.value) === normalizedStatus
    )
  ) {
    return options;
  }

  return [
    ...options,
    {
      value: status,
      label: status,
    },
  ];
}

function formatAccountTableValue(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

function formatAccountDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatAccountTableValue(value);
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAccountStatusClassName(status) {
  const normalizedStatus = normalizeBoardValue(status).toLowerCase();

  return `admin-account-status-badge is-${normalizedStatus || "empty"}`;
}

function getAccountStatusLabel(status) {
  return normalizeBoardValue(status || "UNKNOWN").toUpperCase();
}

function downloadAccountTemplate() {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.createElement("a");

  link.href = accountTemplateUrl;
  link.download = "gift-account-template.xlsx";
  link.click();
}

function AccountExcelGuide({ onDownloadTemplate }) {
  return (
    <section className="admin-account-guide">
      <strong>
        <FaCircleInfo aria-hidden="true" />
        Hướng dẫn tải lên dữ liệu tài khoản từ Excel
      </strong>
      <ul>
        <li>
          File tải lên bắt buộc phải đúng cấu trúc các cột:
          <b> Username, Password, Platform, Tier </b>
          (S, A, B, C, D, E,...), và <b>Token</b> (nếu có).
        </li>
        <li>Chỉ hỗ trợ định dạng Excel 2007 trở lên (mở rộng .xlsx).</li>
        <li>
          Sau khi chuẩn bị dữ liệu, nhấn nút <b>Import Excel</b> bên dưới để
          thực hiện tải danh sách tài khoản vào kho quà.
        </li>
      </ul>
      <button type="button" className="admin-light-button" onClick={onDownloadTemplate}>
        <FaDownload aria-hidden="true" />
        Tải file Excel mẫu
      </button>
    </section>
  );
}

function AdminGiftAccountTable({
  isExpanded = false,
  isSaving,
  onDelete,
  onEdit,
  rows,
  selectedAccountIds,
  selectedRecordId,
  toggleAccountSelection,
  toggleAllAccountSelection,
}) {
  const allVisibleSelected =
    rows.length > 0 &&
    rows.every((row) => selectedAccountIds.has(getRecordId(row, "giftAccounts")));

  return (
    <div
      className={`admin-table-wrap admin-account-table-wrap${
        isExpanded ? " is-expanded" : ""
      }`}
    >
      <table className="admin-table admin-account-table">
        <thead>
          <tr>
            <th className="admin-account-table__check">
              <input
                type="checkbox"
                aria-label="Chọn tất cả tài khoản"
                checked={allVisibleSelected}
                onChange={(event) => toggleAllAccountSelection(event.target.checked)}
              />
            </th>
            <th>Username / Account</th>
            <th>Password</th>
            <th>Nền tảng</th>
            <th>Tier</th>
            <th>Trạng Thái</th>
            <th>Token</th>
            <th>Ngày Gán</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => {
              const recordId = getRecordId(row, "giftAccounts");
              const isChecked = selectedAccountIds.has(recordId);

              return (
                <tr
                  key={recordId}
                  className={
                    recordId === selectedRecordId
                      ? "admin-row-selected admin-account-table__row"
                      : "admin-account-table__row"
                  }
                  tabIndex={0}
                  onClick={() => onEdit(row)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    onEdit(row);
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${row.username || recordId}`}
                      checked={isChecked}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        toggleAccountSelection(recordId, event.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <strong className="admin-account-name">
                      {formatAccountTableValue(row.username)}
                    </strong>
                  </td>
                  <td>{formatAccountTableValue(row.password)}</td>
                  <td>{formatAccountTableValue(row.platform)}</td>
                  <td>
                    <span className="admin-account-tier-badge">
                      {formatAccountTableValue(row.tier)}
                    </span>
                  </td>
                  <td>
                    <span className={getAccountStatusClassName(row.status)}>
                      {getAccountStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>
                    <code className="admin-account-token">
                      {formatAccountTableValue(row.token)}
                    </code>
                  </td>
                  <td>{formatAccountDate(row.assigned_at)}</td>
                  <td>
                    <div className="admin-account-table__actions">
                      <button
                        type="button"
                        className="admin-mini-button"
                        aria-label={`Sửa ${row.username || recordId}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(row);
                        }}
                      >
                        <FaPen aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="admin-mini-button admin-danger-button"
                        aria-label={`Xóa ${row.username || recordId}`}
                        disabled={isSaving}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(row);
                        }}
                      >
                        <FaTrashCan aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={ACCOUNT_TABLE_COLUMNS.length + 2}>
                Không tìm thấy tài khoản phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function _LegacyAdminGiftAccountTable({
  fields,
  isSaving,
  onEdit,
  onStatusChange,
  rows,
  savingStatusRecordId,
  selectedRecordId,
}) {
  const tableColumns = ACCOUNT_TABLE_COLUMNS.filter(
    (column) =>
      fields.some((field) => field.key === column) ||
      rows.some((row) => row[column] !== undefined)
  );

  return (
    <div className="admin-table-wrap admin-account-table-wrap">
      <table className="admin-table admin-account-table">
        <thead>
          <tr>
            <th>Thao tác</th>
            {tableColumns.map((column) => (
              <th key={column}>{getColumnLabel(fields, column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => {
              const recordId = getRecordId(row, "giftAccounts");
              const statusOptions = getRowStatusOptions(fields, row.status);
              const isRowSaving =
                normalizeBoardValue(savingStatusRecordId) ===
                normalizeBoardValue(recordId);

              return (
                <tr
                  key={recordId}
                  className={
                    recordId === selectedRecordId
                      ? "admin-row-selected admin-account-table__row"
                      : "admin-account-table__row"
                  }
                  tabIndex={0}
                  onClick={() => onEdit(row)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    onEdit(row);
                  }}
                >
                  <td>
                    <div className="admin-account-table__actions">
                      <button
                        type="button"
                        className="admin-mini-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(row);
                        }}
                      >
                        <FaPen aria-hidden="true" />
                        Sửa
                      </button>
                    </div>
                  </td>
                  {tableColumns.map((column) => {
                    if (column === "status") {
                      return (
                        <td key={column}>
                          <select
                            className="admin-inline-status"
                            value={row.status || ""}
                            disabled={isSaving}
                            aria-label={`Đổi trạng thái ${row.username || recordId}`}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation();
                              onStatusChange(row, event.target.value);
                            }}
                          >
                            {!row.status ? (
                              <option value="">Chọn status</option>
                            ) : null}
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {isRowSaving ? (
                            <small className="admin-account-table__saving">
                              Đang lưu...
                            </small>
                          ) : null}
                        </td>
                      );
                    }

                    if (column === "password" || column === "token") {
                      return (
                        <td key={column}>
                          <code className="admin-table-code">
                            {formatAccountTableValue(row[column])}
                          </code>
                        </td>
                      );
                    }

                    return (
                      <td key={column}>{formatAccountTableValue(row[column])}</td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={tableColumns.length + 1}>
                Không tìm thấy tài khoản phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminRecordTable({
  columns,
  emptyMessage = "Không tìm thấy bản ghi phù hợp.",
  fields,
  onEdit,
  rows,
  selectedRecordId,
  tableKey,
}) {
  return (
    <div className="admin-table-wrap admin-record-table-wrap">
      <table className="admin-table admin-record-table">
        <thead>
          <tr>
            <th>Thao tác</th>
            {columns.map((column) => (
              <th key={column}>{getColumnLabel(fields, column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => {
              const recordId = getRecordId(row, tableKey);

              return (
                <tr
                  key={recordId}
                  className={
                    recordId === selectedRecordId
                      ? "admin-row-selected admin-record-table__row"
                      : "admin-record-table__row"
                  }
                  tabIndex={0}
                  onClick={() => onEdit(row)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    onEdit(row);
                  }}
                >
                  <td>
                    <button
                      type="button"
                      className="admin-mini-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(row);
                      }}
                    >
                      <FaPen aria-hidden="true" />
                      Sửa
                    </button>
                  </td>
                  {columns.map((column) => (
                    <td key={column}>{formatAccountTableValue(row[column])}</td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length + 1}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getRecordTitle(tableKey, formValues, selectedRecordId) {
  if (tableKey === "giftAccounts") {
    return formValues.username || "Tài khoản mới";
  }

  if (tableKey === "giftPools") {
    return formValues.pool_name || "Bể quà mới";
  }

  if (tableKey === "poolAccountMappings") {
    return formValues.pool_id && formValues.account_id
      ? `${formValues.pool_id} -> ${formValues.account_id}`
      : "Liên kết mới";
  }

  if (tableKey === "productEggMappings") {
    return formValues.kv_product_id && formValues.gift_pool_id
      ? `${formValues.kv_product_id} -> ${formValues.gift_pool_id}`
      : "Mapping sản phẩm mới";
  }

  return selectedRecordId || "Bản ghi mới";
}

function getEntityLabel(tableKey) {
  const labels = {
    adminOrders: "đơn hàng",
    customers: "khách hàng",
    eggs: "trứng",
    giftAccounts: "tài khoản",
    productEggMappings: "mapping trứng",
    products: "sản phẩm",
  };

  return labels[tableKey] || "bản ghi";
}

function getEntityHeading(tableKey) {
  const label = getEntityLabel(tableKey);

  return label === "bản ghi" ? "Thông tin bản ghi" : `Thông tin ${label}`;
}

function AdminFormField({ field, value, onChange }) {
  const fieldId = `admin-field-${field.key}`;
  const fieldClassName = field.wide
    ? "admin-form-field admin-form-field--wide"
    : "admin-form-field";

  if (field.type === "select") {
    return (
      <label className={fieldClassName} htmlFor={fieldId}>
        {field.label}
        <select
          id={fieldId}
          value={value ?? ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          required={field.required}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={fieldClassName} htmlFor={fieldId}>
      {field.label}
      <input
        id={fieldId}
        type={field.type === "datetime" ? "datetime-local" : field.type}
        value={value ?? ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        required={field.required}
      />
    </label>
  );
}

// ADMIN_CRUD_PANEL:
// Giao diện quản trị thao tác với dữ liệu đã tải trong ứng dụng.
// Các handler truyền vào chịu trách nhiệm lưu thay đổi qua dịch vụ dữ liệu khi có.
export function AdminDataCrudPanel({
  activeTableKey = DEFAULT_TABLE_KEY,
  panelTitle = "Quản lý kho account",
  panelDescription = "Tạo account, upload Excel và kiểm tra dữ liệu mới nhất",
  allowedTableKeys = [],
  tables,
  onSaveRecord,
  onDeleteRecord,
  onCreateGiftAccount,
  onUpdateGiftAccount,
  onDeleteGiftAccount,
  onCreateGiftPool,
  onUpdateGiftPool,
  onDeleteGiftPool,
  onAddPoolAccount,
  onRemovePoolAccount,
  onUpdateCustomerStatus,
  onSaveProductEggMapping,
  onDeleteProductEggMapping,
  onUpdateProductEggMappingRates,
  onUpdateProductEggQuantities,
  onUpdateEggHatchTime,
  onImportGiftAccounts,
  onUploadGiftAccounts,
  isRefreshing,
  isSyncingProducts,
  onRefresh,
  onSyncProducts,
  onResetTables,
}) {
  const [tableKey, setTableKey] = useState(activeTableKey);
  const [keyword, setKeyword] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [_savingStatusRecordId, setSavingStatusRecordId] = useState("");
  const [draggingRecordId, setDraggingRecordId] = useState("");
  const [dragOverValue, setDragOverValue] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("");
  const [accountTierFilter, setAccountTierFilter] = useState("");
  const [lastChangedAccountId, setLastChangedAccountId] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState(() => new Set());
  const [isImportingAccounts, setImportingAccounts] = useState(false);
  const accountImportInputRef = useRef(null);

  const rows = tables[tableKey] || EMPTY_ROWS;
  const allowedTableKeySet = useMemo(
    () => new Set(allowedTableKeys),
    [allowedTableKeys]
  );
  const visibleTables = useMemo(
    () =>
      ADMIN_TABLES.filter(
        (table) =>
          (!allowedTableKeySet.size || allowedTableKeySet.has(table.key)) &&
          (ALWAYS_VISIBLE_TABLE_KEYS.has(table.key) ||
            (tables[table.key] || []).length > 0)
      ),
    [allowedTableKeySet, tables]
  );
  const fields = useMemo(() => getTableFields(tableKey), [tableKey]);
  const isCustomersTable = tableKey === "customers";
  const isEggsTable = tableKey === "eggs";
  const isGiftAccountsTable = tableKey === "giftAccounts";
  const isGiftPoolsTable = tableKey === "giftPools";
  const isPoolMappingsTable = tableKey === "poolAccountMappings";
  const isProductsTable = tableKey === "products";
  const isProductMappingsTable = tableKey === "productEggMappings";
  const shouldUseBoard = isPoolMappingsTable;
  const isServiceManagedIdTable =
    isGiftAccountsTable ||
    isGiftPoolsTable ||
    isPoolMappingsTable ||
    isProductMappingsTable;
  const visibleFields = useMemo(
    () => {
      const filteredFields = fields.filter((field) => {
        if (isServiceManagedIdTable && field.key === "id") {
          return false;
        }

        if (
          isGiftAccountsTable &&
          (field.key === "created_at" || field.key === "assigned_at")
        ) {
          return false;
        }

        return true;
      });

      if (!isGiftAccountsTable) {
        return filteredFields;
      }

      return [...filteredFields].sort(
        (first, second) =>
          ACCOUNT_FORM_FIELD_ORDER.indexOf(first.key) -
          ACCOUNT_FORM_FIELD_ORDER.indexOf(second.key)
      );
    },
    [fields, isGiftAccountsTable, isServiceManagedIdTable]
  );
  const filteredRows = useMemo(
    () => searchTableRows(rows, keyword),
    [keyword, rows]
  );
  const accountRows = useMemo(() => {
    if (!isGiftAccountsTable) {
      return filteredRows;
    }

    const statusFilter = normalizeComparableValue(accountStatusFilter);
    const tierFilter = getAccountTierValue({ tier: accountTierFilter });
    const visibleRows = filteredRows.filter((row) => {
      const matchesStatus =
        !statusFilter ||
        normalizeComparableValue(row.status) === statusFilter;
      const matchesTier = !tierFilter || getAccountTierValue(row) === tierFilter;

      return matchesStatus && matchesTier;
    });

    return sortGiftAccountRows(visibleRows, lastChangedAccountId);
  }, [
    accountStatusFilter,
    accountTierFilter,
    filteredRows,
    isGiftAccountsTable,
    lastChangedAccountId,
  ]);
  const accountStatusOptions = useMemo(
    () =>
      mergeSelectOptions(
        getFieldOptions(fields, "status"),
        rows.map((row) => row.status),
        (value) => normalizeBoardValue(value).toUpperCase()
      ),
    [fields, rows]
  );
  const accountTierOptions = useMemo(
    () =>
      mergeSelectOptions(
        getFieldOptions(fields, "tier"),
        rows.map((row) => getAccountTierValue(row)),
        (value) => `Tier ${normalizeBoardValue(value).toUpperCase()}`
      ),
    [fields, rows]
  );
  const accountPagination = useAdminClientPagination(
    accountRows,
    `${tableKey}|${keyword}|${accountStatusFilter}|${accountTierFilter}|${lastChangedAccountId}|${rows.length}`,
    ACCOUNT_DEFAULT_PAGE_SIZE
  );
  const recordPagination = useAdminClientPagination(
    filteredRows,
    `${tableKey}|${keyword}|${rows.length}`
  );
  const paginatedAccountRows = accountPagination.pageRows;
  const paginatedRows = recordPagination.pageRows;
  const visibleColumns = useMemo(
    () =>
      getPriorityColumns(tableKey, filteredRows.length ? filteredRows : rows, fields),
    [fields, filteredRows, rows, tableKey]
  );
  const boardConfig = useMemo(() => getBoardConfig(tableKey), [tableKey]);
  const boardValues = useMemo(
    () => getBoardValues(tableKey, filteredRows.length ? filteredRows : rows, tables),
    [filteredRows, rows, tableKey, tables]
  );
  const boardRowsByValue = useMemo(() => {
    const map = new Map(
      boardValues.map((value) => [normalizeBoardValue(value), []])
    );

    filteredRows.forEach((row) => {
      const value = getBoardValue(tableKey, row, tables, boardConfig);
      const key = normalizeBoardValue(value);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(row);
    });

    return map;
  }, [boardConfig, boardValues, filteredRows, tableKey, tables]);
  const hasActiveForm = Object.keys(formValues).length > 0;
  const recordTitle = getRecordTitle(tableKey, formValues, selectedRecordId);
  const entityLabel = getEntityLabel(tableKey);
  const recordModalTitle = getEntityHeading(tableKey);
  const deleteButtonLabel = `Xóa ${entityLabel}`;
  const addButtonLabel = isGiftAccountsTable
    ? "Thêm tài khoản"
    : isGiftPoolsTable
      ? "Thêm bể quà"
      : isPoolMappingsTable
        ? "Gắn tài khoản"
        : isProductMappingsTable
          ? "Liên kết sản phẩm"
          : "Thêm bản ghi";
  const resetTableState = (nextTableKey) => {
    setTableKey(nextTableKey);
    setKeyword("");
    setAccountStatusFilter("");
    setAccountTierFilter("");
    setLastChangedAccountId("");
    setSelectedAccountIds(new Set());
    setSelectedRecordId("");
    setFormValues({});
    setRecordModalOpen(false);
    setDeleteModalOpen(false);
    setResetModalOpen(false);
  };
  const notify = (nextMessage) => showAdminAlert(nextMessage);

  useEffect(() => {
    if (!activeTableKey || activeTableKey === tableKey) {
      return;
    }

    resetTableState(activeTableKey);
  }, [activeTableKey, tableKey]);

  useEffect(() => {
    if (visibleTables.some((table) => table.key === tableKey)) {
      return;
    }

    const nextTableKey = visibleTables[0]?.key || "giftAccounts";

    resetTableState(nextTableKey);
  }, [tableKey, visibleTables]);

  useEffect(() => {
    if (!isGiftAccountsTable) {
      return;
    }

    const accountIds = new Set(rows.map((row) => getRecordId(row, "giftAccounts")));

    setLastChangedAccountId((currentId) =>
      currentId && !accountIds.has(currentId) ? "" : currentId
    );
    setSelectedAccountIds((currentIds) => {
      const nextIds = new Set(
        [...currentIds].filter((accountId) => accountIds.has(accountId))
      );

      return nextIds.size === currentIds.size ? currentIds : nextIds;
    });
  }, [isGiftAccountsTable, rows]);

  const updateField = (fieldKey, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: value,
    }));
  };

  const toggleAccountSelection = (accountId, isSelected) => {
    setSelectedAccountIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isSelected) {
        nextIds.add(accountId);
      } else {
        nextIds.delete(accountId);
      }

      return nextIds;
    });
  };

  const toggleAllAccountSelection = (isSelected) => {
    setSelectedAccountIds((currentIds) => {
      const nextIds = new Set(currentIds);

      paginatedAccountRows.forEach((row) => {
        const accountId = getRecordId(row, "giftAccounts");

        if (isSelected) {
          nextIds.add(accountId);
        } else {
          nextIds.delete(accountId);
        }
      });

      return nextIds;
    });
  };

  const importAccountFile = async (file) => {
    setImportingAccounts(true);

    try {
      if (onUploadGiftAccounts) {
        const payload = await onUploadGiftAccounts(file);
        const importedCount =
          payload?.accountsImported ??
          payload?.imported ??
          payload?.successCount ??
          payload?.count;

        notify(
          payload?.message ||
            (Number.isFinite(Number(importedCount))
              ? `Đã upload và nhập ${importedCount} account thành công.`
              : "Đã upload file Excel thành công.")
        );
        return;
      }

      const payload = await parseAccountImportFile(file);
      const result = onImportGiftAccounts?.(payload);
      const mappingMessage = result?.mappingsImported
        ? ` và ${result.mappingsImported} liên kết kho`
        : "";

      notify(
        `Đã nhập ${result?.accountsImported || 0} account${mappingMessage}.`
      );
    } catch (error) {
      notify(error.message || "Không thể nhập file account.");
    } finally {
      setImportingAccounts(false);
    }
  };

  const handleAccountFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (file) {
      await importAccountFile(file);
    }

    event.target.value = "";
  };

  const deleteGiftAccountsByIds = async (accountIds) => {
    const ids = [...accountIds].filter(Boolean);

    if (!ids.length || isSaving) {
      return;
    }

    if (
      !confirmAdminAction(
        ids.length === 1
          ? "Xác nhận xóa tài khoản đã chọn?"
          : `Xác nhận xóa ${ids.length} tài khoản đã chọn?`
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      if (onDeleteGiftAccount) {
        await onDeleteGiftAccount(ids);
      }

      ids.forEach((accountId) => onDeleteRecord("giftAccounts", accountId));

      setSelectedAccountIds((currentIds) => {
        const nextIds = new Set(currentIds);
        ids.forEach((accountId) => nextIds.delete(accountId));
        return nextIds;
      });

      if (ids.includes(selectedRecordId)) {
        setSelectedRecordId("");
        setFormValues({});
        setRecordModalOpen(false);
      }

      notify(`Đã xóa ${ids.length} tài khoản.`);
    } catch (error) {
      notify(error.message || "Không thể xóa tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  const startAdd = () => {
    const record = createEmptyRecord(tableKey, rows);
    setSelectedRecordId("");
    setFormValues(normalizeRecordForForm(record, tableKey));
    setDeleteModalOpen(false);
    setRecordModalOpen(true);
  };

  const startEdit = (record) => {
    setSelectedRecordId(getRecordId(record, tableKey));
    setFormValues(normalizeRecordForForm(record, tableKey));
    setDeleteModalOpen(false);
    setRecordModalOpen(true);
  };

  const _updateGiftAccountStatus = async (record, nextStatus) => {
    if (isSaving) {
      return;
    }

    const recordId = getRecordId(record, "giftAccounts");

    if (!recordId) {
      notify("Không tìm thấy ID tài khoản để đổi trạng thái.");
      return;
    }

    if (normalizeBoardValue(record.status) === normalizeBoardValue(nextStatus)) {
      return;
    }

    const nextRecord = {
      ...record,
      status: nextStatus,
    };

    setIsSaving(true);
    setSavingStatusRecordId(recordId);

    try {
      const savedRecord = onUpdateGiftAccount
        ? await onUpdateGiftAccount(nextRecord, recordId)
        : nextRecord;

      onSaveRecord("giftAccounts", savedRecord);
      setLastChangedAccountId(recordId);

      if (normalizeBoardValue(selectedRecordId) === normalizeBoardValue(recordId)) {
        setFormValues(normalizeRecordForForm(savedRecord, "giftAccounts"));
      }

      notify("Đã cập nhật trạng thái tài khoản.");
    } catch (error) {
      notify(error.message || "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setIsSaving(false);
      setSavingStatusRecordId("");
    }
  };

  const saveForm = async () => {
    if (isSaving) {
      return;
    }

    const isCreating = !selectedRecordId;
    setIsSaving(true);

    try {
      let record = buildRecordFromForm(formValues, tableKey);
      let shouldDeleteSelectedBeforeSave = false;
      const previousGiftAccount =
        isGiftAccountsTable && !isCreating
          ? rows.find(
              (row) =>
                normalizeBoardValue(getRecordId(row, "giftAccounts")) ===
                normalizeBoardValue(selectedRecordId)
            )
          : null;

      if (isGiftAccountsTable && isCreating && onCreateGiftAccount) {
        const payload = await onCreateGiftAccount(record);
        const responseRecord =
          payload?.data || payload?.account || payload?.giftAccount || payload;
        record = {
          ...record,
          ...(responseRecord && typeof responseRecord === "object"
            ? responseRecord
            : {}),
        };
      }

      if (isGiftAccountsTable && !isCreating && onUpdateGiftAccount) {
        record = await onUpdateGiftAccount(record, selectedRecordId);

        if (
          normalizeComparableValue(previousGiftAccount?.status) !==
          normalizeComparableValue(record.status)
        ) {
          setLastChangedAccountId(getRecordId(record, "giftAccounts") || selectedRecordId);
        }
      }

      if (isGiftPoolsTable) {
        if (isCreating && onCreateGiftPool) {
          record = await onCreateGiftPool(record);
        } else if (!isCreating && onUpdateGiftPool) {
          record = await onUpdateGiftPool(record, selectedRecordId);
        }
      }

      if (isPoolMappingsTable && onAddPoolAccount) {
        const currentRecord = rows.find(
          (row) => getRecordId(row, tableKey) === selectedRecordId
        );
        const isSameMapping =
          currentRecord?.pool_id === record.pool_id &&
          currentRecord?.account_id === record.account_id;

        if (currentRecord && !isSameMapping && onRemovePoolAccount) {
          await onRemovePoolAccount(currentRecord);
          shouldDeleteSelectedBeforeSave = true;
        }

        record = isSameMapping ? currentRecord : await onAddPoolAccount(record);
      }

      if (isCustomersTable && !isCreating && onUpdateCustomerStatus) {
        record = await onUpdateCustomerStatus(record, selectedRecordId);
      }

      if (isProductMappingsTable && onSaveProductEggMapping) {
        record = await onSaveProductEggMapping(record, selectedRecordId);
      }

      if (shouldDeleteSelectedBeforeSave) {
        onDeleteRecord(tableKey, selectedRecordId);
      }

      const savedRecords = Array.isArray(record) ? record : [record];
      const primaryRecord = savedRecords[0];

      savedRecords.forEach((savedRecord) => {
        onSaveRecord(tableKey, savedRecord);
      });
      setSelectedRecordId(getRecordId(primaryRecord, tableKey));
      notify(
        isGiftAccountsTable && isCreating && onCreateGiftAccount
          ? "Đã thêm tài khoản thành công."
          : isGiftAccountsTable && !isCreating && onUpdateGiftAccount
            ? "Đã cập nhật tài khoản thành công."
          : isGiftPoolsTable
            ? "Đã đồng bộ bể quà thành công."
            : isPoolMappingsTable
              ? "Đã đồng bộ liên kết tài khoản."
              : isCustomersTable && !isCreating && onUpdateCustomerStatus
                ? "Đã cập nhật trạng thái khách hàng."
                : isProductMappingsTable && onSaveProductEggMapping
                  ? "Đã đồng bộ mapping sản phẩm - trứng."
                  : "Đã lưu thay đổi."
      );
      setRecordModalOpen(false);
    } catch (error) {
      notify(error.message || "Dữ liệu bản ghi không hợp lệ.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeleteSelected = () => {
    setDeleteModalOpen(true);
  };

  const handleResetTablesClick = () => {
    setResetModalOpen(true);
  };

  const confirmResetTables = () => {
    onResetTables?.();
    setSelectedRecordId("");
    setFormValues({});
    setRecordModalOpen(false);
    setDeleteModalOpen(false);
    setResetModalOpen(false);
    notify("Đã khôi phục dữ liệu.");
  };

  const deleteSelected = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedRecordId) {
      notify("Chọn một bản ghi trước khi xóa.");
      return;
    }

    setIsSaving(true);

    try {
      const selectedRecord = rows.find(
        (row) => getRecordId(row, tableKey) === selectedRecordId
      );

      if (isGiftPoolsTable && onDeleteGiftPool) {
        await onDeleteGiftPool(selectedRecordId);
      }

      if (isGiftAccountsTable && onDeleteGiftAccount) {
        await onDeleteGiftAccount(selectedRecordId);
      }

      if (isPoolMappingsTable && onRemovePoolAccount) {
        await onRemovePoolAccount(selectedRecord || formValues);
      }

      if (isProductMappingsTable && onDeleteProductEggMapping) {
        await onDeleteProductEggMapping(selectedRecordId);
      }

      onDeleteRecord(tableKey, selectedRecordId);
      setSelectedRecordId("");
      setFormValues({});
      notify(
        isGiftPoolsTable
          ? "Đã xóa bể quà."
          : isGiftAccountsTable && onDeleteGiftAccount
            ? "Đã xóa tài khoản thành công."
          : isPoolMappingsTable
            ? "Đã gỡ liên kết tài khoản."
            : isProductMappingsTable && onDeleteProductEggMapping
              ? "Đã xóa mapping sản phẩm - trứng."
              : "Đã xóa bản ghi."
      );
      setRecordModalOpen(false);
      setDeleteModalOpen(false);
    } catch (error) {
      notify(error.message || "Không thể xóa bản ghi.");
    } finally {
      setIsSaving(false);
    }
  };

  const persistDraggedRecord = async (recordId, nextValue) => {
    if (isSaving || boardConfig.readOnly) {
      return;
    }

    const currentRecord = rows.find(
      (row) => normalizeBoardValue(getRecordId(row, tableKey)) === normalizeBoardValue(recordId)
    );

    if (!currentRecord) {
      return;
    }

    const currentValue = getBoardValue(tableKey, currentRecord, tables, boardConfig);

    if (normalizeBoardValue(currentValue) === normalizeBoardValue(nextValue)) {
      setDraggingRecordId("");
      setDragOverValue("");
      return;
    }

    const nextRecord = {
      ...currentRecord,
      [boardConfig.field]: nextValue,
    };

    setIsSaving(true);

    try {
      let savedRecord = nextRecord;

      if (isGiftAccountsTable && onUpdateGiftAccount) {
        savedRecord = await onUpdateGiftAccount(nextRecord, recordId);
      } else if (isCustomersTable && onUpdateCustomerStatus) {
        savedRecord = await onUpdateCustomerStatus(nextRecord, recordId);
      } else if (isProductMappingsTable && onSaveProductEggMapping) {
        savedRecord = await onSaveProductEggMapping(nextRecord, recordId);
      }

      onSaveRecord(tableKey, savedRecord);
      setSelectedRecordId(getRecordId(savedRecord, tableKey) || recordId);
      setFormValues(normalizeRecordForForm(savedRecord, tableKey));
    } catch (error) {
      notify(error.message || "Không thể cập nhật bằng kéo thả.");
    } finally {
      setIsSaving(false);
      setDraggingRecordId("");
      setDragOverValue("");
    }
  };

  const handleRecordDragStart = (event, recordId) => {
    if (boardConfig.readOnly) {
      event.preventDefault();
      return;
    }

    setDraggingRecordId(recordId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", recordId);
  };

  const handleBoardDragOver = (event, value) => {
    if (boardConfig.readOnly) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverValue(normalizeBoardValue(value));
  };

  const handleBoardDrop = (event, value) => {
    if (boardConfig.readOnly) {
      return;
    }

    event.preventDefault();
    const recordId = event.dataTransfer.getData("text/plain");

    persistDraggedRecord(recordId, value);
  };

  if (isGiftPoolsTable) {
    return (
      <AdminGiftPoolTablePanel
        panelTitle={panelTitle}
        panelDescription={panelDescription}
        tables={tables}
        onSaveRecord={onSaveRecord}
        onDeleteRecord={onDeleteRecord}
        onCreateGiftPool={onCreateGiftPool}
        onUpdateGiftPool={onUpdateGiftPool}
        onDeleteGiftPool={onDeleteGiftPool}
        onAddPoolAccount={onAddPoolAccount}
        onRemovePoolAccount={onRemovePoolAccount}
      />
    );
  }

  if (isCustomersTable) {
    return (
      <AdminCustomerTablePanel
        isRefreshing={isRefreshing}
        tables={tables}
        onRefresh={onRefresh}
        onSaveRecord={onSaveRecord}
        onUpdateCustomerStatus={onUpdateCustomerStatus}
      />
    );
  }

  if (isEggsTable) {
    return (
      <AdminEggTablePanel
        isRefreshing={isRefreshing}
        tables={tables}
        onRefresh={onRefresh}
        onSaveRecord={onSaveRecord}
        onUpdateEggHatchTime={onUpdateEggHatchTime}
      />
    );
  }

  if (isProductsTable) {
    return (
      <AdminProductTablePanel
        isRefreshing={isRefreshing}
        isSyncingProducts={isSyncingProducts}
        tables={tables}
        onDeleteProductEggMapping={onDeleteProductEggMapping}
        onDeleteRecord={onDeleteRecord}
        onRefresh={onRefresh}
        onSaveProductEggMapping={onSaveProductEggMapping}
        onSaveRecord={onSaveRecord}
        onSyncProducts={onSyncProducts}
        onUpdateProductEggMappingRates={onUpdateProductEggMappingRates}
        onUpdateProductEggQuantities={onUpdateProductEggQuantities}
      />
    );
  }

  if (shouldUseBoard) {
    return (
      <AdminGiftPoolDragPanel
        panelTitle={panelTitle}
        panelDescription={panelDescription}
        tables={tables}
        onSaveRecord={onSaveRecord}
        onDeleteRecord={onDeleteRecord}
        onCreateGiftPool={onCreateGiftPool}
        onUpdateGiftPool={onUpdateGiftPool}
        onDeleteGiftPool={onDeleteGiftPool}
        onAddPoolAccount={onAddPoolAccount}
        onRemovePoolAccount={onRemovePoolAccount}
        onResetTables={onResetTables}
      />
    );
  }

  return (
    <section
      className={`admin-panel admin-crud-panel${
        isGiftAccountsTable ? " admin-account-manager-panel" : ""
      }`}
    >
      {!isGiftAccountsTable ? (
      <div className="admin-panel__head">
        <div>
          <h2>{panelTitle}</h2>
          <span>{panelDescription}</span>
        </div>
        <button type="button" className="admin-light-button" onClick={handleResetTablesClick}>
          <FaRotateLeft aria-hidden="true" />
          Khôi phục dữ liệu
        </button>
      </div>
      ) : null}

      {isGiftAccountsTable ? (
        <>
          <AdminPageGuide
            action={
              <button
                type="button"
                className="admin-light-button"
                onClick={downloadAccountTemplate}
              >
                <FaDownload aria-hidden="true" />
                Tải file Excel mẫu
              </button>
            }
            pageKey="accounts"
          />
          <div className="admin-account-toolbar">
            <label className="admin-account-search">
              <span>Tìm kiếm</span>
              <input
                type="search"
                placeholder="Tìm theo username, platform, tier..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <div className="admin-account-toolbar__actions">
              <select
                aria-label="Lọc trạng thái tài khoản"
                value={accountStatusFilter}
                onChange={(event) => setAccountStatusFilter(event.target.value)}
              >
                <option value="">Mọi trạng thái</option>
                {accountStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Lọc tier tài khoản"
                value={accountTierFilter}
                onChange={(event) => setAccountTierFilter(event.target.value)}
              >
                <option value="">Mọi tier</option>
                {accountTierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={startAdd}>
                <FaPlus aria-hidden="true" />
                Thêm tài khoản
              </button>
              <button
                type="button"
                className="admin-light-button"
                disabled={isImportingAccounts}
                onClick={() => accountImportInputRef.current?.click()}
              >
                <FaFileExcel aria-hidden="true" />
                {isImportingAccounts ? "Đang import" : "Import Excel"}
              </button>
              <input
                ref={accountImportInputRef}
                type="file"
                accept=".xlsx,.csv,.tsv"
                hidden
                onChange={handleAccountFileChange}
              />
              <button
                type="button"
                className="admin-danger-button"
                disabled={!selectedAccountIds.size || isSaving}
                onClick={() => deleteGiftAccountsByIds(selectedAccountIds)}
              >
                <FaTrashCan aria-hidden="true" />
                Xóa hàng loạt
              </button>
              <button
                type="button"
                className="admin-light-button admin-account-refresh-button"
                aria-label="Khôi phục dữ liệu"
                onClick={handleResetTablesClick}
              >
                <FaRotateRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : (
      <div className="admin-crud-toolbar">
        <label>
          Tìm kiếm
          <input
            type="search"
            placeholder="Tìm username, tier, trạng thái, nền tảng..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <button type="button" onClick={startAdd}>
          {addButtonLabel}
        </button>
      </div>
      )}

      <div
        className="admin-crud-grid admin-crud-grid--table-only"
      >
        <div className="admin-dnd-wrap">
          {isGiftAccountsTable ? (
            <AdminGiftAccountTable
              isExpanded={accountPagination.pageSize >= ACCOUNT_DEFAULT_PAGE_SIZE}
              isSaving={isSaving}
              rows={paginatedAccountRows}
              selectedAccountIds={selectedAccountIds}
              selectedRecordId={selectedRecordId}
              toggleAccountSelection={toggleAccountSelection}
              toggleAllAccountSelection={toggleAllAccountSelection}
              onDelete={(row) =>
                deleteGiftAccountsByIds([getRecordId(row, "giftAccounts")])
              }
              onEdit={startEdit}
            />
          ) : shouldUseBoard ? (
          <div className="admin-dnd-board">
            {boardValues.map((value) => {
              const valueKey = normalizeBoardValue(value);
              const columnRows = boardRowsByValue.get(valueKey) || [];
              const isDragOver = dragOverValue === valueKey;

              return (
                <section
                  className={`admin-dnd-column${isDragOver ? " is-drag-over" : ""}`}
                  key={valueKey || "empty"}
                  onDragLeave={() => setDragOverValue("")}
                  onDragOver={(event) => handleBoardDragOver(event, value)}
                  onDrop={(event) => handleBoardDrop(event, value)}
                >
                  <div className="admin-dnd-column__head">
                    <div>
                      <span>{getColumnLabel(fields, boardConfig.field)}</span>
                      <strong>
                        {getBoardLabel(tableKey, fields, boardConfig, value)}
                      </strong>
                    </div>
                    <em>{columnRows.length}</em>
                  </div>

                  <div className="admin-dnd-card-list" role="list">
                    {columnRows.length ? (
                      columnRows.map((row) => {
                        const recordId = getRecordId(row, tableKey);
                        const cardFields = getRecordCardFields(
                          tableKey,
                          row,
                          fields,
                          boardConfig.field
                        );
                        const isDragging =
                          normalizeBoardValue(draggingRecordId) ===
                          normalizeBoardValue(recordId);

                        return (
                          <article
                            className={`admin-dnd-card${
                              selectedRecordId === recordId ? " is-selected" : ""
                            }${isDragging ? " is-dragging" : ""}${
                              boardConfig.readOnly ? " is-readonly" : ""
                            }`}
                            draggable={!boardConfig.readOnly}
                            key={recordId}
                            role="listitem"
                            tabIndex={0}
                            onClick={() => startEdit(row)}
                            onDragEnd={() => {
                              setDraggingRecordId("");
                              setDragOverValue("");
                            }}
                            onDragStart={(event) =>
                              handleRecordDragStart(event, recordId)
                            }
                          >
                            <FaGripVertical
                              aria-hidden="true"
                              className="admin-dnd-card__grip"
                            />
                            <div className="admin-dnd-card__main">
                              <strong>
                                {getRecordCardTitle(tableKey, row, recordId)}
                              </strong>
                              <span>{recordId || "no-id"}</span>
                            </div>
                            <button
                              type="button"
                              className="admin-mini-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEdit(row);
                              }}
                            >
                              <FaPen aria-hidden="true" />
                              Sửa
                            </button>
                            <div className="admin-dnd-card__meta">
                              {cardFields.map((item) => (
                                <small key={item.key}>
                                  <b>{item.label}</b>
                                  <span>{String(item.value ?? "-")}</span>
                                </small>
                              ))}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="admin-dnd-empty">
                        <FaBoxOpen aria-hidden="true" />
                        <span>Trống</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          ) : (
            <AdminRecordTable
              columns={visibleColumns}
              fields={fields}
              rows={paginatedRows}
              selectedRecordId={selectedRecordId}
              tableKey={tableKey}
              onEdit={startEdit}
            />
          )}

          <AdminClientPagination
            itemLabel={isGiftAccountsTable ? "tài khoản" : "bản ghi"}
            pagination={isGiftAccountsTable ? accountPagination : recordPagination}
          />

          <table className="admin-table admin-crud-table" hidden>
            <thead>
              <tr>
                <th>Thao tác</th>
                {visibleColumns.map((column) => (
                  <th key={column}>{getColumnLabel(fields, column)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length ? (
                paginatedRows.map((row) => {
                  const recordId = getRecordId(row, tableKey);
                  return (
                    <tr
                      key={recordId}
                      className={
                        recordId === selectedRecordId ? "admin-row-selected" : ""
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="admin-mini-button"
                          onClick={() => startEdit(row)}
                        >
                          <FaPen aria-hidden="true" />
                          Sửa
                        </button>
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column}>{String(row[column] ?? "-")}</td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 1}>
                    Không tìm thấy bản ghi phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {shouldUseBoard ? (
        <div className="admin-record-editor">
          <div className="admin-record-editor__head">
            <div>
              <strong>
                {isGiftAccountsTable ? "Thông tin tài khoản" : "Thông tin bản ghi"}
              </strong>
              <span>{recordTitle}</span>
            </div>
          </div>

          {hasActiveForm ? (
            <div className="admin-form-grid">
              {visibleFields.map((field) => (
                <AdminFormField
                  key={field.key}
                  field={field}
                  value={formValues[field.key]}
                  onChange={updateField}
                />
              ))}
            </div>
          ) : (
            <div className="admin-form-placeholder">
              Chọn một dòng để sửa hoặc bấm nút dấu cộng để thêm tài khoản.
            </div>
          )}

          <div className="admin-crud-actions">
            <button
              type="button"
              onClick={saveForm}
              disabled={!hasActiveForm || isSaving}
            >
              <FaFloppyDisk aria-hidden="true" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              className="admin-danger-button"
              onClick={requestDeleteSelected}
              disabled={!selectedRecordId || isSaving}
            >
              <FaTrashCan aria-hidden="true" />
              {isGiftAccountsTable
                ? "Xóa tài khoản"
                : isGiftPoolsTable
                  ? "Xóa bể quà"
                  : isPoolMappingsTable
                    ? "Gỡ liên kết"
                    : isProductMappingsTable
                      ? "Xóa mapping"
                      : "Xóa bản ghi"}
            </button>
          </div>
        </div>
        ) : null}
      </div>

      {isRecordModalOpen ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-account-record-title"
          >
            <div className="admin-record-editor admin-record-editor--modal">
              <div className="admin-record-editor__head">
                <div>
                  <strong id="admin-account-record-title">
                    {isGiftAccountsTable
                      ? selectedRecordId
                        ? "Cập Nhật Tài Khoản Quà"
                        : "Thêm Tài Khoản Quà"
                      : recordModalTitle}
                    <span hidden>
                    Thông tin tài khoản
                    </span>
                  </strong>
                  <span>{recordTitle}</span>
                </div>
                <div className="admin-modal-head-actions">
                  <button
                    type="button"
                    className="admin-modal-close"
                    aria-label="Đóng modal tài khoản"
                    onClick={() => setRecordModalOpen(false)}
                  >
                    <FaXmark aria-hidden="true" />
                    Đóng
                  </button>
                </div>
              </div>

              {hasActiveForm ? (
                <div className="admin-form-grid">
                  {visibleFields.map((field) => (
                    <AdminFormField
                      key={field.key}
                      field={field}
                      value={formValues[field.key]}
                      onChange={updateField}
                    />
                  ))}
                </div>
              ) : (
                <div className="admin-form-placeholder">
                  Chọn một dòng để sửa hoặc bấm nút dấu cộng để thêm tài khoản.
                </div>
              )}

              {isGiftAccountsTable ? (
                <div className="admin-crud-actions admin-account-modal-actions">
                  <button
                    type="button"
                    className="admin-light-button"
                    disabled={isSaving}
                    onClick={() => setRecordModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={saveForm}
                    disabled={!hasActiveForm || isSaving}
                  >
                    {isSaving
                      ? "Đang lưu..."
                      : selectedRecordId
                        ? "Cập nhật"
                        : "Thêm tài khoản"}
                  </button>
                </div>
              ) : null}

              <div className="admin-crud-actions" hidden={isGiftAccountsTable}>
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={!hasActiveForm || isSaving}
                >
                  <FaFloppyDisk aria-hidden="true" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={requestDeleteSelected}
                  disabled={!selectedRecordId || isSaving}
                >
                  <FaTrashCan aria-hidden="true" />
                  <span>{deleteButtonLabel}</span>
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}

      {isDeleteModalOpen ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-record-title"
          >
            <div className="admin-panel__head">
              <div>
                <h2 id="admin-delete-record-title">{deleteButtonLabel}?</h2>
                <span>{recordTitle}</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Đóng xác nhận xóa"
                onClick={() => setDeleteModalOpen(false)}
              >
                <FaXmark aria-hidden="true" />
                Đóng
              </button>
            </div>
            <p className="admin-confirm-copy">
              Hành động này sẽ xóa bản ghi khỏi danh sách và cập nhật dữ liệu nếu được phép.
            </p>
            <div className="admin-crud-actions">
              <button
                type="button"
                className="admin-danger-button"
                disabled={isSaving}
                onClick={deleteSelected}
              >
                <FaTrashCan aria-hidden="true" />
                <span>{isSaving ? "Đang xóa..." : deleteButtonLabel}</span>
              </button>
              <button
                type="button"
                className="admin-light-button"
                disabled={isSaving}
                onClick={() => setDeleteModalOpen(false)}
              >
                Hủy
              </button>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}

      {isResetModalOpen ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reset-table-title"
          >
            <div className="admin-panel__head">
              <div>
                <h2 id="admin-reset-table-title">Khôi phục dữ liệu?</h2>
                <span>{panelTitle}</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Đóng xác nhận khôi phục"
                onClick={() => setResetModalOpen(false)}
              >
                <FaXmark aria-hidden="true" />
                Đóng
              </button>
            </div>
            <p className="admin-confirm-copy">
              Màn hiện tại sẽ tải lại dữ liệu nguồn và bỏ các chỉnh sửa chưa lưu trong form.
            </p>
            <div className="admin-crud-actions">
              <button type="button" onClick={confirmResetTables}>
                <FaRotateLeft aria-hidden="true" />
                Khôi phục
              </button>
              <button
                type="button"
                className="admin-light-button"
                onClick={() => setResetModalOpen(false)}
              >
                Hủy
              </button>
            </div>
          </section>
        </AdminModalPortal>
      ) : null}
    </section>
  );
}
