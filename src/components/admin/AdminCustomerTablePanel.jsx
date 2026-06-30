import { useEffect, useMemo, useState } from "react";
import {
  FaMagnifyingGlass,
  FaPen,
  FaRotateRight,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";

const EMPTY_ROWS = [];
const STATUS_OPTIONS = [
  { value: "NEW", label: "NEW" },
  { value: "WARNING", label: "WARNING (Cảnh báo gian lận/hoàn hàng)" },
  { value: "BANNED", label: "BANNED (Khóa khách hàng)" },
  { value: "TRUSTED_1", label: "TRUSTED_1" },
  { value: "TRUSTED_2", label: "TRUSTED_2" },
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeStatus(value) {
  return normalizeText(value || "NEW").toUpperCase();
}

function getCustomerId(customer) {
  return normalizeText(customer?.id || customer?.customerCode);
}

function getCustomerCode(customer) {
  return normalizeText(customer?.customerCode || customer?.customer_code);
}

function getCustomerName(customer) {
  return normalizeText(customer?.customerName || customer?.customer_name);
}

function getNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}

function customerMatchesKeyword(customer, keyword) {
  if (!keyword) {
    return true;
  }

  return [
    getCustomerCode(customer),
    getCustomerName(customer),
    customer?.status,
    customer?.successCount,
    customer?.returnStreak,
  ]
    .map(normalizeKey)
    .join(" ")
    .includes(keyword);
}

function getStatusClassName(status) {
  return `admin-customer-status is-${normalizeStatus(status).toLowerCase()}`;
}

function getCustomerForm(customer) {
  return {
    customerName: getCustomerName(customer) || "null",
    status: normalizeStatus(customer?.status),
    successCount: getNumber(customer?.successCount),
    returnStreak: getNumber(customer?.returnStreak),
  };
}

export function AdminCustomerTablePanel({
  isRefreshing = false,
  onRefresh,
  onSaveRecord,
  onUpdateCustomerStatus,
  tables,
}) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const customers = tables.customers || EMPTY_ROWS;
  const normalizedKeyword = normalizeKey(keyword);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customerMatchesKeyword(customer, normalizedKeyword) &&
          (!statusFilter || normalizeStatus(customer.status) === statusFilter)
      ),
    [customers, normalizedKeyword, statusFilter]
  );

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setMessage(""), 2800);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormValues(getCustomerForm(customer));
    setMessage("");
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setFormValues(null);
  };

  const updateField = (field, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const saveCustomer = async () => {
    if (!editingCustomer || !formValues || isSaving) {
      return;
    }

    const nextCustomer = {
      ...editingCustomer,
      status: normalizeStatus(formValues.status),
      successCount: getNumber(formValues.successCount),
      returnStreak: getNumber(formValues.returnStreak),
    };

    setIsSaving(true);

    try {
      const savedCustomer = onUpdateCustomerStatus
        ? await onUpdateCustomerStatus(nextCustomer)
        : nextCustomer;

      onSaveRecord?.("customers", savedCustomer || nextCustomer);
      setMessage("Đã cập nhật trạng thái khách hàng.");
      closeEditModal();
    } catch (error) {
      setMessage(error.message || "Không thể cập nhật khách hàng.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-panel admin-customer-manager-panel">
      <div className="admin-customer-toolbar">
        <label className="admin-customer-search">
          <FaMagnifyingGlass aria-hidden="true" />
          <span>Tìm kiếm</span>
          <input
            type="search"
            placeholder="Tìm theo mã KH, tên KH..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <div className="admin-customer-toolbar__actions">
          <select
            aria-label="Lọc trạng thái khách hàng"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Mọi trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          <button type="button" disabled={isRefreshing} onClick={onRefresh}>
            <FaRotateRight aria-hidden="true" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="admin-table-wrap admin-customer-table-wrap">
        <table className="admin-table admin-customer-table">
          <thead>
            <tr>
              <th>Mã Khách Hàng</th>
              <th>Tên Khách Hàng</th>
              <th>Trạng Thái</th>
              <th>Số Đơn Thành Công</th>
              <th>Chuỗi Hoàn Hàng</th>
              <th>Số Lần Cảnh Báo</th>
              <th>Ngày Tạo</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length ? (
              filteredCustomers.map((customer) => {
                const customerId = getCustomerId(customer);
                const returnStreak = getNumber(customer.returnStreak);

                return (
                  <tr key={customerId || getCustomerCode(customer)}>
                    <td>
                      <strong className="admin-customer-code">
                        {getCustomerCode(customer) || "-"}
                      </strong>
                    </td>
                    <td>{getCustomerName(customer) || "-"}</td>
                    <td>
                      <span className={getStatusClassName(customer.status)}>
                        {normalizeStatus(customer.status)}
                      </span>
                    </td>
                    <td>{getNumber(customer.successCount)}</td>
                    <td>
                      <span
                        className={
                          returnStreak > 0
                            ? "admin-customer-return-streak is-warning"
                            : "admin-customer-return-streak"
                        }
                      >
                        {returnStreak}
                        {returnStreak > 0 ? (
                          <FaTriangleExclamation aria-hidden="true" />
                        ) : null}
                      </span>
                    </td>
                    <td>{getNumber(customer.warningCount)}</td>
                    <td>{formatDateTime(customer.createdAt || customer.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-mini-button admin-customer-edit-button"
                        onClick={() => openEditModal(customer)}
                      >
                        <FaPen aria-hidden="true" />
                        Sửa
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8}>Không tìm thấy khách hàng phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {message ? (
        <p className="admin-crud-message admin-fade-message">{message}</p>
      ) : null}

      {editingCustomer && formValues ? (
        <div className="admin-modal-backdrop">
          <section
            className="admin-panel admin-modal admin-customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-customer-modal-title"
          >
            <div className="admin-customer-modal__head">
              <h2 id="admin-customer-modal-title">
                Cập Nhật Trạng Thái Khách Hàng
              </h2>
              <button
                type="button"
                aria-label="Đóng modal khách hàng"
                onClick={closeEditModal}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <div className="admin-customer-form">
              <label>
                Tên khách hàng
                <input type="text" readOnly value={formValues.customerName} />
              </label>
              <label>
                Trạng thái mới
                <select
                  value={formValues.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Số đơn mua thành công
                <input
                  min="0"
                  type="number"
                  value={formValues.successCount}
                  onChange={(event) =>
                    updateField("successCount", event.target.value)
                  }
                />
              </label>
              <label>
                Chuỗi hoàn trả liên tiếp
                <input
                  min="0"
                  type="number"
                  value={formValues.returnStreak}
                  onChange={(event) =>
                    updateField("returnStreak", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="admin-customer-modal__actions">
              <button
                type="button"
                className="admin-light-button"
                disabled={isSaving}
                onClick={closeEditModal}
              >
                Hủy
              </button>
              <button type="button" disabled={isSaving} onClick={saveCustomer}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
