import { useEffect, useMemo, useState } from "react";
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

const EMPTY_ROWS = [];
const ALWAYS_VISIBLE_TABLE_KEYS = new Set([
  "giftAccounts",
  "giftPools",
  "poolAccountMappings",
]);
const DEFAULT_TABLE_KEY = "giftAccounts";
const PRIORITY_COLUMNS_BY_TABLE = {
  giftAccounts: ["username", "password", "tier", "platform", "status"],
  customers: ["customerCode", "customerName", "status", "successCount", "warningCount"],
  eggs: ["egg_type", "status", "hatch_at", "order_id", "account_id"],
  giftPools: ["pool_name", "tier", "created_at"],
  kiotvietOrders: ["order_code", "status", "financial_status", "fulfillment_status", "total_price"],
  poolAccountMappings: ["pool_id", "account_id"],
  products: ["kvProductId", "name", "basePrice", "lastSyncedAt"],
};

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
// Backend thay các handler thêm/sửa/xóa bằng endpoint CRUD thật khi nối KiotViet/database.
export function AdminDataCrudPanel({
  tables,
  tableCounts,
  onSaveRecord,
  onDeleteRecord,
  onCreateGiftAccount,
  onCreateGiftPool,
  onUpdateGiftPool,
  onDeleteGiftPool,
  onAddPoolAccount,
  onRemovePoolAccount,
  onImportGiftAccounts,
  onUploadGiftAccounts,
  onResetTables,
}) {
  const [tableKey, setTableKey] = useState(DEFAULT_TABLE_KEY);
  const [keyword, setKeyword] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const rows = tables[tableKey] || EMPTY_ROWS;
  const visibleTables = useMemo(
    () =>
      ADMIN_TABLES.filter(
        (table) =>
          ALWAYS_VISIBLE_TABLE_KEYS.has(table.key) ||
          (tables[table.key] || []).length > 0
      ),
    [tables]
  );
  const fields = useMemo(() => getTableFields(tableKey), [tableKey]);
  const isGiftAccountsTable = tableKey === "giftAccounts";
  const isGiftPoolsTable = tableKey === "giftPools";
  const isPoolMappingsTable = tableKey === "poolAccountMappings";
  const isBackendManagedIdTable =
    isGiftAccountsTable || isGiftPoolsTable || isPoolMappingsTable;
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
  const hasActiveForm = Object.keys(formValues).length > 0;
  const recordTitle = getRecordTitle(tableKey, formValues, selectedRecordId);
  const addButtonLabel = isGiftAccountsTable
    ? "Thêm tài khoản"
    : isGiftPoolsTable
      ? "Thêm bể quà"
      : isPoolMappingsTable
        ? "Gắn tài khoản"
        : "Thêm bản ghi";

  useEffect(() => {
    if (visibleTables.some((table) => table.key === tableKey)) {
      return;
    }

    const nextTableKey = visibleTables[0]?.key || "giftAccounts";
    setTableKey(nextTableKey);
    setKeyword("");
    setSelectedRecordId("");
    setFormValues({});
    setMessage("");
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

      if (isGiftAccountsTable && isCreating && onCreateGiftAccount) {
        const payload = await onCreateGiftAccount(record);
        record = { ...record, ...(payload?.data || payload?.account || {}) };
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
        }

        record = isSameMapping ? currentRecord : await onAddPoolAccount(record);
      }

      onSaveRecord(tableKey, record);
      setSelectedRecordId(getRecordId(record, tableKey));
      setMessage(
        isGiftAccountsTable && isCreating && onCreateGiftAccount
          ? "Đã thêm tài khoản lên backend."
          : isGiftPoolsTable
            ? "Đã đồng bộ bể quà lên backend."
            : isPoolMappingsTable
              ? "Đã đồng bộ liên kết tài khoản."
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

      if (isPoolMappingsTable && onRemovePoolAccount) {
        await onRemovePoolAccount(selectedRecord || formValues);
      }

      onDeleteRecord(tableKey, selectedRecordId);
      setSelectedRecordId("");
      setFormValues({});
      setMessage(
        isGiftPoolsTable
          ? "Đã xóa bể quà."
          : isPoolMappingsTable
            ? "Đã gỡ liên kết tài khoản."
            : "Đã xóa bản ghi."
      );
    } catch (error) {
      setMessage(error.message || "Không thể xóa bản ghi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTableChange = (event) => {
    setTableKey(event.target.value);
    setKeyword("");
    setSelectedRecordId("");
    setFormValues({});
    setMessage("");
  };

  return (
    <section className="admin-panel admin-crud-panel">
      <div className="admin-panel__head">
        <div>
          <h2>Quản lý kho account</h2>
          <span>Tạo account, upload Excel và kiểm tra dữ liệu raw từ API</span>
        </div>
        <button type="button" className="admin-light-button" onClick={onResetTables}>
          Khôi phục dữ liệu
        </button>
      </div>

      <div className="admin-crud-toolbar">
        <label>
          Bảng dữ liệu
          <select value={tableKey} onChange={handleTableChange}>
            {visibleTables.map((table) => (
              <option key={table.key} value={table.key}>
                {table.label} ({tableCounts[table.key] || 0})
              </option>
            ))}
          </select>
        </label>
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

      <div className="admin-crud-grid">
        <div className="admin-table-wrap">
          {isGiftAccountsTable && onImportGiftAccounts ? (
            <AdminAccountImportPanel
              onImportGiftAccounts={onImportGiftAccounts}
              onUploadGiftAccounts={onUploadGiftAccounts}
              onImported={setMessage}
            />
          ) : null}

          <table className="admin-table admin-crud-table">
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
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              className="admin-danger-button"
              onClick={deleteSelected}
              disabled={!selectedRecordId || isSaving}
            >
              {isGiftAccountsTable
                ? "Xóa tài khoản"
                : isGiftPoolsTable
                  ? "Xóa bể quà"
                  : isPoolMappingsTable
                    ? "Gỡ liên kết"
                    : "Xóa bản ghi"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
