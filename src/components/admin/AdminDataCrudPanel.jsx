import { useMemo, useState } from "react";
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
// Backend thay các handler thêm/sửa/xóa bằng endpoint CRUD thật khi nối MySQL/SAPO.
export function AdminDataCrudPanel({
  tables,
  tableCounts,
  onSaveRecord,
  onDeleteRecord,
  onImportGiftAccounts,
  onResetTables,
}) {
  const [tableKey, setTableKey] = useState(ADMIN_TABLES[0].key);
  const [keyword, setKeyword] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [message, setMessage] = useState("");

  const rows = tables[tableKey] || EMPTY_ROWS;
  const fields = useMemo(() => getTableFields(tableKey), [tableKey]);
  const filteredRows = useMemo(
    () => searchTableRows(rows, keyword),
    [keyword, rows]
  );
  const visibleColumns = useMemo(
    () => getVisibleColumns(filteredRows.length ? filteredRows : rows),
    [filteredRows, rows]
  );
  const hasActiveForm = Object.keys(formValues).length > 0;
  const isGiftAccountsTable = tableKey === "giftAccounts";

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

  const saveForm = () => {
    try {
      const record = buildRecordFromForm(formValues, tableKey);
      onSaveRecord(tableKey, record);
      setSelectedRecordId(getRecordId(record, tableKey));
      setMessage("Đã lưu thay đổi.");
    } catch (error) {
      setMessage(error.message || "Dữ liệu bản ghi không hợp lệ.");
    }
  };

  const deleteSelected = () => {
    if (!selectedRecordId) {
      setMessage("Chọn một bản ghi trước khi xóa.");
      return;
    }

    onDeleteRecord(tableKey, selectedRecordId);
    setSelectedRecordId("");
    setFormValues({});
    setMessage("Đã xóa bản ghi.");
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
          <h2>Quản lý dữ liệu vận hành</h2>
          <span>Thêm, sửa, xóa và tìm kiếm bản ghi</span>
        </div>
        <button type="button" className="admin-light-button" onClick={onResetTables}>
          Khôi phục dữ liệu
        </button>
      </div>

      <div className="admin-crud-toolbar">
        <label>
          Bảng dữ liệu
          <select value={tableKey} onChange={handleTableChange}>
            {ADMIN_TABLES.map((table) => (
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
            placeholder="Tìm theo mã đơn, trạng thái, tài khoản, ID..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <button type="button" onClick={startAdd}>
          Thêm bản ghi
        </button>
      </div>

      <div className="admin-crud-grid">
        <div className="admin-table-wrap">
          {isGiftAccountsTable && onImportGiftAccounts ? (
            <AdminAccountImportPanel
              onImportGiftAccounts={onImportGiftAccounts}
              onImported={setMessage}
            />
          ) : null}

          <table className="admin-table admin-crud-table">
            <thead>
              <tr>
                <th>Thao tác</th>
                {visibleColumns.map((column) => (
                  <th key={column}>{column}</th>
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
              <strong>Thông tin bản ghi</strong>
              <span>{selectedRecordId || "Bản ghi mới"}</span>
            </div>
            <button type="button" className="admin-light-button" onClick={startAdd}>
              Tạo mới
            </button>
          </div>

          {hasActiveForm ? (
            <div className="admin-form-grid">
              {fields.map((field) => (
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
              Chọn một dòng để sửa hoặc bấm Tạo mới để thêm bản ghi.
            </div>
          )}

          {message ? <p>{message}</p> : null}

          <div className="admin-crud-actions">
            <button type="button" onClick={saveForm} disabled={!hasActiveForm}>
              Lưu thay đổi
            </button>
            <button
              type="button"
              className="admin-danger-button"
              onClick={deleteSelected}
              disabled={!selectedRecordId}
            >
              Xóa bản ghi
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
