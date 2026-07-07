import { useMemo, useState } from "react";
import {
  FaMagnifyingGlass,
  FaPen,
  FaRotateRight,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";
import { mergeSelectOptions } from "../../services/adminCrudService";
import {
  confirmAdminAction,
  showAdminAlert,
} from "../../services/adminBrowserFeedback";
import {
  CUSTOMER_STATUS,
  CUSTOMER_STATUS_OPTIONS,
  getCustomerStatusLabel,
  isBlockedCustomerStatus,
  isWarningCustomerStatus,
  normalizeCustomerStatus,
} from "../../utils/customerStatus";
import { useAdminClientPagination } from "../../hooks/useAdminClientPagination";
import { AdminClientPagination } from "./AdminClientPagination";
import { AdminModalPortal } from "./AdminModalPortal";

const EMPTY_ROWS = [];
const QUICK_STATUS_OPTIONS = [
  CUSTOMER_STATUS.WARNING,
  CUSTOMER_STATUS.TEMP_BANNED,
  CUSTOMER_STATUS.BANNED,
  CUSTOMER_STATUS.NORMAL,
];
const STATUS_ACTION_LABELS = {
  [CUSTOMER_STATUS.NORMAL]: "gỡ khóa",
  [CUSTOMER_STATUS.WARNING]: "cảnh báo",
  [CUSTOMER_STATUS.TEMP_BANNED]: "khóa tạm",
  [CUSTOMER_STATUS.BANNED]: "ban vĩnh viễn",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeStatus(value) {
  return normalizeCustomerStatus(value);
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

function getStatusOptionLabel(option) {
  const label = option.label || getCustomerStatusLabel(option.value);

  return `${option.value} (${label})`;
}

function getRiskLevel(customer) {
  const status = normalizeStatus(customer?.status);

  if (isBlockedCustomerStatus(status)) {
    return "locked";
  }

  if (
    isWarningCustomerStatus(status) ||
    getNumber(customer?.warningCount) > 0 ||
    getNumber(customer?.returnStreak) > 0
  ) {
    return "warning";
  }

  return "normal";
}

function getRiskLabel(customer) {
  const riskLevel = getRiskLevel(customer);

  if (riskLevel === "locked") {
    return "Bị khóa";
  }

  if (riskLevel === "warning") {
    return "Cần theo dõi";
  }

  return "Ổn";
}

function getRiskClassName(customer) {
  return `admin-customer-risk is-${getRiskLevel(customer)}`;
}

function getQuickActionLabel(status) {
  const normalizedStatus = normalizeStatus(status);

  return STATUS_ACTION_LABELS[normalizedStatus] || normalizedStatus;
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

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function fromDateTimeLocalValue(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function customerMatchesKeyword(customer, keyword) {
  if (!keyword) {
    return true;
  }

  return [
    getCustomerCode(customer),
    getCustomerName(customer),
    customer?.status,
    getCustomerStatusLabel(customer?.status),
    customer?.successCount,
    customer?.returnStreak,
    customer?.returnCount,
    customer?.warningCount,
    customer?.unbanAt,
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
    returnCount: getNumber(customer?.returnCount),
    warningCount: getNumber(customer?.warningCount),
    unbanAt: toDateTimeLocalValue(customer?.unbanAt),
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
  const [isSaving, setIsSaving] = useState(false);
  const customers = tables.customers || EMPTY_ROWS;
  const normalizedKeyword = normalizeKey(keyword);
  const statusOptions = useMemo(
    () =>
      mergeSelectOptions(
        CUSTOMER_STATUS_OPTIONS,
        customers.map((customer) => normalizeStatus(customer.status)),
        getCustomerStatusLabel
      ),
    [customers]
  );
  const customerStats = useMemo(
    () =>
      customers.reduce(
        (stats, customer) => {
          const status = normalizeStatus(customer.status);

          stats.total += 1;

          if (status === CUSTOMER_STATUS.WARNING) {
            stats.warning += 1;
          }

          if (status === CUSTOMER_STATUS.TEMP_BANNED) {
            stats.tempBanned += 1;
          }

          if (status === CUSTOMER_STATUS.BANNED) {
            stats.banned += 1;
          }

          return stats;
        },
        { total: 0, warning: 0, tempBanned: 0, banned: 0 }
      ),
    [customers]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customerMatchesKeyword(customer, normalizedKeyword) &&
          (!statusFilter || normalizeStatus(customer.status) === statusFilter)
      ),
    [customers, normalizedKeyword, statusFilter]
  );
  const pagination = useAdminClientPagination(
    filteredCustomers,
    `${keyword}|${statusFilter}|${customers.length}`
  );
  const paginatedCustomers = pagination.pageRows;

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormValues(getCustomerForm(customer));
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setFormValues(null);
  };

  const updateField = (field, value) => {
    setFormValues((currentValues) =>
      currentValues
        ? {
            ...currentValues,
            [field]: value,
          }
        : currentValues
    );
  };

  const updateFields = (patch) => {
    setFormValues((currentValues) =>
      currentValues
        ? {
            ...currentValues,
            ...patch,
          }
        : currentValues
    );
  };

  const persistCustomer = async (
    nextCustomer,
    confirmationMessage,
    successMessage = "Đã cập nhật trạng thái khách hàng."
  ) => {
    if (isSaving || !confirmAdminAction(confirmationMessage)) {
      return false;
    }

    setIsSaving(true);

    try {
      const savedCustomer = onUpdateCustomerStatus
        ? await onUpdateCustomerStatus(nextCustomer)
        : nextCustomer;

      onSaveRecord?.("customers", savedCustomer || nextCustomer);
      showAdminAlert(successMessage);
      return true;
    } catch (error) {
      showAdminAlert(error.message || "Không thể cập nhật khách hàng.");
      return false;
    } finally {
      setIsSaving(false);
    }
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
      returnCount: getNumber(formValues.returnCount),
      warningCount: getNumber(formValues.warningCount),
      unbanAt: fromDateTimeLocalValue(formValues.unbanAt),
    };
    const didSave = await persistCustomer(
      nextCustomer,
      `Xác nhận cập nhật trạng thái khách hàng ${
        getCustomerCode(editingCustomer) || ""
      }?`
    );

    if (didSave) {
      closeEditModal();
    }
  };

  const quickSetCustomerStatus = async (customer, nextStatus) => {
    const status = normalizeStatus(nextStatus);
    const nextCustomer = {
      ...customer,
      status,
      successCount: getNumber(customer.successCount),
      returnStreak: getNumber(customer.returnStreak),
      unbanAt: status === CUSTOMER_STATUS.NORMAL ? null : customer.unbanAt || null,
    };
    const customerCode = getCustomerCode(customer);

    await persistCustomer(
      nextCustomer,
      `Xác nhận ${getQuickActionLabel(status)} khách hàng ${customerCode}?`,
      `Đã ${getQuickActionLabel(status)} khách hàng ${customerCode}.`
    );
  };

  const applyQuickStatus = (nextStatus) => {
    const status = normalizeStatus(nextStatus);

    updateFields({
      status,
      unbanAt: status === CUSTOMER_STATUS.NORMAL ? "" : formValues?.unbanAt || "",
    });
  };

  return (
    <section className="admin-panel admin-customer-manager-panel admin-fraud-panel">
      <div className="admin-fraud-head">
        <div>
          <h2>Kiểm soát khách hàng gian lận</h2>
          <p>
            Cập nhật cảnh báo, khóa tạm hoặc ban vĩnh viễn theo dữ liệu trả về từ API.
          </p>
        </div>
        <div className="admin-fraud-stats" aria-label="Thống kê khách hàng">
          <span>
            Tổng <b>{customerStats.total}</b>
          </span>
          <span>
            Cảnh báo <b>{customerStats.warning}</b>
          </span>
          <span>
            Tạm khóa <b>{customerStats.tempBanned}</b>
          </span>
          <span>
            Banned <b>{customerStats.banned}</b>
          </span>
          <span>
            Đang xem <b>{filteredCustomers.length}</b>
          </span>
        </div>
      </div>

      <div className="admin-customer-toolbar">
        <label className="admin-customer-search">
          <FaMagnifyingGlass aria-hidden="true" />
          <span>Tìm kiếm</span>
          <input
            type="search"
            placeholder="Tìm theo mã KH, tên KH, status..."
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
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {getStatusOptionLabel(option)}
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
              <th>Rủi Ro</th>
              <th>Chuỗi VIP</th>
              <th>Tín Dụng Ấp Sớm</th>
              <th>Chuỗi Hoàn Hàng</th>
              <th>Tổng Hoàn/Hủy</th>
              <th>Tổng Cảnh Báo</th>
              <th>Mở Lại Lúc</th>
              <th>Ngày Tạo</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length ? (
              paginatedCustomers.map((customer) => {
                const customerId = getCustomerId(customer);
                const returnStreak = getNumber(customer.returnStreak);
                const isLocked = isBlockedCustomerStatus(customer.status);

                return (
                  <tr
                    className={isLocked ? "is-customer-locked" : undefined}
                    key={customerId || getCustomerCode(customer)}
                  >
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
                    <td>
                      <span className={getRiskClassName(customer)}>
                        {getRiskLabel(customer)}
                      </span>
                    </td>
                    <td>{getNumber(customer.successCount)}</td>
                    <td>
                      <span className="admin-early-hatch-credit">
                        {getNumber(customer.earlyHatchCredits)}
                      </span>
                    </td>
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
                    <td>{getNumber(customer.returnCount)}</td>
                    <td>{getNumber(customer.warningCount)}</td>
                    <td>{formatDateTime(customer.unbanAt)}</td>
                    <td>{formatDateTime(customer.createdAt || customer.created_at)}</td>
                    <td>
                      <div className="admin-customer-row-actions">
                        <button
                          type="button"
                          className="admin-mini-button admin-customer-edit-button"
                          disabled={isSaving}
                          onClick={() => openEditModal(customer)}
                        >
                          <FaPen aria-hidden="true" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={`admin-mini-button admin-customer-ban-button ${
                            isLocked ? "is-unlock" : "is-ban"
                          }`}
                          disabled={isSaving}
                          onClick={() =>
                            quickSetCustomerStatus(
                              customer,
                              isLocked ? CUSTOMER_STATUS.NORMAL : CUSTOMER_STATUS.BANNED
                            )
                          }
                        >
                          {isLocked ? "Gỡ khóa" : "Ban"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12}>Không tìm thấy khách hàng phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminClientPagination itemLabel="khách hàng" pagination={pagination} />

      {editingCustomer && formValues ? (
        <AdminModalPortal>
          <section
            className="admin-panel admin-modal admin-customer-modal admin-fraud-modal"
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

            <div className="admin-fraud-customer-card">
              <span>Mã khách hàng</span>
              <strong>{getCustomerCode(editingCustomer) || "-"}</strong>
              <em>
                Hiện tại: {normalizeStatus(editingCustomer.status)} -{" "}
                {getCustomerStatusLabel(editingCustomer.status)}
              </em>
            </div>

            <div className="admin-fraud-actions" aria-label="Hành động nhanh">
              {QUICK_STATUS_OPTIONS.map((status) => (
                <button
                  type="button"
                  className={
                    status === CUSTOMER_STATUS.BANNED
                      ? "admin-mini-button admin-danger-button"
                      : "admin-mini-button"
                  }
                  key={status}
                  disabled={isSaving}
                  onClick={() => applyQuickStatus(status)}
                >
                  {getQuickActionLabel(status)}
                </button>
              ))}
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
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {getStatusOptionLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Chuỗi mở VIP
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
              <label>
                Mở lại lúc
                <input
                  type="datetime-local"
                  value={formValues.unbanAt}
                  onChange={(event) => updateField("unbanAt", event.target.value)}
                />
              </label>
              <label>
                Tổng hoàn/hủy
                <input type="number" readOnly value={formValues.returnCount} />
              </label>
              <label>
                Tổng cảnh báo
                <input type="number" readOnly value={formValues.warningCount} />
              </label>
            </div>

            <p className="admin-customer-form__note">
              `returnCount` và `warningCount` là dữ liệu tích lũy từ backend, chỉ xem
              và không chỉnh tay ở đây.
            </p>

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
        </AdminModalPortal>
      ) : null}
    </section>
  );
}
