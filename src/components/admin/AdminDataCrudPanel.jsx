import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaFloppyDisk,
  FaGripVertical,
  FaPen,
  FaPlus,
  FaRotateLeft,
  FaTrashCan,
} from "react-icons/fa6";
import { AdminAccountImportPanel } from "./AdminAccountImportPanel";
import {
  ADMIN_TABLES,
  buildRecordFromForm,
  createEmptyRecord,
  getRecordId,
  getTableFields,
  getVisibleColumns,
  normalizeRecordForForm,
  searchTableRows,
} from "../../services/adminCrudService";
import { AdminGiftPoolDragPanel } from "./AdminGiftPoolDragPanel";

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
  customers: ["customerCode", "customerName", "status", "successCount", "warningCount"],
  eggs: ["egg_type", "status", "hatch_at", "order_id", "account_id"],
  giftPools: ["pool_name", "tier", "created_at"],
  adminOrders: ["order_code", "status", "fulfillment_status", "delivered_at", "last_synced_at"],
  poolAccountMappings: ["pool_id", "account_id"],
  productEggMappings: ["kv_product_id", "egg_type", "gift_pool_id", "egg_tier"],
  products: ["kvProductId", "name", "basePrice", "lastSyncedAt"],
};

const BOARD_CONFIG_BY_TABLE = {
  giftAccounts: {
    field: "status",
    fallbackValue: "available",
    values: ["available", "reserved", "used"],
  },
  customers: {
    field: "status",
    fallbackValue: "ACTIVE",
    values: ["ACTIVE", "WARNING", "BANNED"],
  },
  eggs: {
    field: "status",
    fallbackValue: "ready",
    values: ["locked", "ready", "incubating", "hatched", "invalidated"],
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

const PRODUCT_MAPPING_LABELS = {
  mapped: "Đã mapping",
  unmapped: "Chưa mapping",
};

function normalizeBoardValue(value) {
  return String(value ?? "").trim();
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
    const labels = {
      ACTIVE: "Đang ổn",
      WARNING: "Cảnh báo",
      BANNED: "Bị khóa",
    };

    return labels[normalizeBoardValue(value).toUpperCase()] || normalizeBoardValue(value);
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

// BACKEND_ADMIN_CRUD_GIAO_DIEN:
// Giao diện quản trị dữ liệu hiện thao tác trên state frontend.
// Backend thay các handler thêm/sửa/xóa bằng endpoint CRUD thật khi nối database.
export function AdminDataCrudPanel({
  activeTableKey = DEFAULT_TABLE_KEY,
  panelTitle = "Quản lý kho account",
  panelDescription = "Tạo account, upload Excel và kiểm tra dữ liệu raw từ API",
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
  onImportGiftAccounts,
  onUploadGiftAccounts,
  onResetTables,
}) {
  const [tableKey, setTableKey] = useState(activeTableKey);
  const [keyword, setKeyword] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggingRecordId, setDraggingRecordId] = useState("");
  const [dragOverValue, setDragOverValue] = useState("");

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
  const isGiftAccountsTable = tableKey === "giftAccounts";
  const isGiftPoolsTable = tableKey === "giftPools";
  const isPoolMappingsTable = tableKey === "poolAccountMappings";
  const isProductMappingsTable = tableKey === "productEggMappings";
  const isBackendManagedIdTable =
    isGiftAccountsTable ||
    isGiftPoolsTable ||
    isPoolMappingsTable ||
    isProductMappingsTable;
  const visibleFields = useMemo(
    () =>
      fields.filter((field) => !(isBackendManagedIdTable && field.key === "id")),
    [fields, isBackendManagedIdTable]
  );
  const filteredRows = useMemo(
    () => searchTableRows(rows, keyword),
    [keyword, rows]
  );
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
    setSelectedRecordId("");
    setFormValues({});
    setMessage("");
  };

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

  const updateField = (fieldKey, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: value,
    }));
  };

  const startAdd = () => {
    const record = createEmptyRecord(tableKey, rows);
    setSelectedRecordId("");
    setFormValues(normalizeRecordForForm(record, tableKey));
    setMessage("Đang tạo bản ghi mới.");
  };

  const startEdit = (record) => {
    setSelectedRecordId(getRecordId(record, tableKey));
    setFormValues(normalizeRecordForForm(record, tableKey));
    setMessage("Đang chỉnh sửa bản ghi đã chọn.");
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
      setMessage(
        isGiftAccountsTable && isCreating && onCreateGiftAccount
          ? "Đã thêm tài khoản lên backend."
          : isGiftAccountsTable && !isCreating && onUpdateGiftAccount
            ? "Đã cập nhật tài khoản trên backend."
          : isGiftPoolsTable
            ? "Đã đồng bộ bể quà lên backend."
            : isPoolMappingsTable
              ? "Đã đồng bộ liên kết tài khoản."
              : isCustomersTable && !isCreating && onUpdateCustomerStatus
                ? "Đã cập nhật trạng thái khách hàng."
                : isProductMappingsTable && onSaveProductEggMapping
                  ? "Đã đồng bộ mapping sản phẩm - trứng."
                  : "Đã lưu thay đổi."
      );
    } catch (error) {
      setMessage(error.message || "Dữ liệu bản ghi không hợp lệ.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedRecordId) {
      setMessage("Chọn một bản ghi trước khi xóa.");
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
      setMessage(
        isGiftPoolsTable
          ? "Đã xóa bể quà."
          : isGiftAccountsTable && onDeleteGiftAccount
            ? "Đã xóa tài khoản trên backend."
          : isPoolMappingsTable
            ? "Đã gỡ liên kết tài khoản."
            : isProductMappingsTable && onDeleteProductEggMapping
              ? "Đã xóa mapping sản phẩm - trứng."
              : "Đã xóa bản ghi."
      );
    } catch (error) {
      setMessage(error.message || "Không thể xóa bản ghi.");
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
      setMessage("Đã cập nhật bằng kéo thả.");
    } catch (error) {
      setMessage(error.message || "Không thể cập nhật bằng kéo thả.");
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

  if (isGiftPoolsTable || isPoolMappingsTable) {
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
    <section className="admin-panel admin-crud-panel">
      <div className="admin-panel__head">
        <div>
          <h2>{panelTitle}</h2>
          <span>{panelDescription}</span>
        </div>
        <button type="button" className="admin-light-button" onClick={onResetTables}>
          <FaRotateLeft aria-hidden="true" />
          Khôi phục dữ liệu
        </button>
      </div>

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
          <FaPlus aria-hidden="true" />
          {addButtonLabel}
        </button>
      </div>

      <div className="admin-crud-grid">
        <div className="admin-dnd-wrap">
          {isGiftAccountsTable && onImportGiftAccounts ? (
            <AdminAccountImportPanel
              onImportGiftAccounts={onImportGiftAccounts}
              onUploadGiftAccounts={onUploadGiftAccounts}
              onImported={setMessage}
            />
          ) : null}

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
              {filteredRows.length ? (
                filteredRows.slice(0, 12).map((row) => {
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

        <div className="admin-record-editor">
          <div className="admin-record-editor__head">
            <div>
              <strong>
                {isGiftAccountsTable ? "Thông tin tài khoản" : "Thông tin bản ghi"}
              </strong>
              <span>{recordTitle}</span>
            </div>
            <button type="button" className="admin-light-button" onClick={startAdd}>
              <FaPlus aria-hidden="true" />
              Tạo mới
            </button>
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
              Chọn một dòng để sửa hoặc bấm Tạo mới để thêm tài khoản.
            </div>
          )}

          {message ? <p>{message}</p> : null}

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
              onClick={deleteSelected}
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
      </div>
    </section>
  );
}
