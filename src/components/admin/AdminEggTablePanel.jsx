import { useMemo, useState } from "react";
import {
  FaBolt,
  FaClock,
  FaMagnifyingGlass,
  FaRotateRight,
  FaXmark,
} from "react-icons/fa6";

const EMPTY_ROWS = [];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function getEggId(egg) {
  return normalizeText(egg?.id);
}

function getOrderId(order) {
  return normalizeText(order?.id || order?.order_id || order?.orderId);
}

function getOrderCode(order) {
  return normalizeText(order?.order_code || order?.orderCode || order?.code);
}

function getPoolId(pool) {
  return normalizeText(pool?.id || pool?.gift_pool_id || pool?.poolId);
}

function getPoolName(pool) {
  return normalizeText(pool?.pool_name || pool?.poolName || pool?.name);
}

function getAccountId(account) {
  return normalizeText(account?.id || account?.account_id || account?.accountId);
}

function getAccountName(account) {
  return normalizeText(account?.username || account?.account || account?.name);
}

function getAccountMeta(account) {
  const platform = normalizeText(account?.platform || account?.game || account?.type);
  const tier = normalizeText(account?.tier || account?.egg_tier).toUpperCase();

  if (platform && tier) {
    return `${platform.toUpperCase()} (${tier})`;
  }

  if (platform) {
    return platform.toUpperCase();
  }

  return tier ? `TIER ${tier}` : "";
}

function getValidDate(...values) {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function formatDateTime(value) {
  const date = getValidDate(value);

  if (!date) {
    return "-";
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

function toDateTimeInputValue(value) {
  const date = getValidDate(value) || new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-") + `T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function fromDateTimeInputValue(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function getEggTypeValue(egg) {
  return Number(egg?.egg_type || egg?.eggType || 0);
}

function getEggTypeLabel(type) {
  if (Number(type) === 1) {
    return "NHẬN NGAY (T1)";
  }

  if (Number(type) === 2) {
    return "CẦN ẤP (T2)";
  }

  return type ? `LOẠI ${type}` : "CHƯA RÕ";
}

function getEggTypeClass(type) {
  return Number(type) === 2 ? "incubate" : "instant";
}

function getStatusLabel(status) {
  const normalizedStatus = normalizeKey(status);

  if (["claimed", "hatched", "opened"].includes(normalizedStatus)) {
    return "CLAIMED";
  }

  if (["cancelled", "canceled", "invalidated", "invalid"].includes(normalizedStatus)) {
    return "CANCELLED";
  }

  if (["incubating", "pending"].includes(normalizedStatus)) {
    return "PENDING";
  }

  if (normalizedStatus === "ready") {
    return "READY";
  }

  if (normalizedStatus === "locked") {
    return "LOCKED";
  }

  return normalizeText(status).toUpperCase() || "-";
}

function getStatusClass(status) {
  const normalizedStatus = normalizeKey(status);

  if (["claimed", "hatched", "opened"].includes(normalizedStatus)) {
    return "is-claimed";
  }

  if (["cancelled", "canceled", "invalidated", "invalid"].includes(normalizedStatus)) {
    return "is-cancelled";
  }

  if (["ready"].includes(normalizedStatus)) {
    return "is-ready";
  }

  return "is-pending";
}

function canEditHatchTime(egg) {
  const status = normalizeKey(egg?.status);

  return !["claimed", "hatched", "opened", "cancelled", "canceled", "invalidated", "invalid"].includes(status);
}

function buildOptionRows(values, getLabel) {
  return [...new Set(values.map(normalizeText).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "vi"))
    .map((value) => ({
      value,
      label: getLabel ? getLabel(value) : value,
    }));
}

function getEggOrder(egg, orderById) {
  return orderById.get(normalizeText(egg?.order_id || egg?.orderId)) || null;
}

function getEggPool(egg, poolById) {
  return poolById.get(normalizeText(egg?.gift_pool_id || egg?.giftPoolId)) || null;
}

function getEggAccount(egg, accountById) {
  return accountById.get(normalizeText(egg?.account_id || egg?.accountId)) || null;
}

export function AdminEggTablePanel({
  isRefreshing = false,
  onRefresh,
  onSaveRecord,
  onUpdateEggHatchTime,
  tables,
}) {
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingEgg, setEditingEgg] = useState(null);
  const [hatchTimeValue, setHatchTimeValue] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const eggs = tables.eggs || EMPTY_ROWS;
  const orders = tables.adminOrders || EMPTY_ROWS;
  const pools = tables.giftPools || EMPTY_ROWS;
  const accounts = tables.giftAccounts || EMPTY_ROWS;
  const normalizedKeyword = normalizeKey(keyword);

  const orderById = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      const orderId = getOrderId(order);

      if (orderId) {
        map.set(orderId, order);
      }
    });

    return map;
  }, [orders]);

  const poolById = useMemo(() => {
    const map = new Map();

    pools.forEach((pool) => {
      const poolId = getPoolId(pool);

      if (poolId) {
        map.set(poolId, pool);
      }
    });

    return map;
  }, [pools]);

  const accountById = useMemo(() => {
    const map = new Map();

    accounts.forEach((account) => {
      const accountId = getAccountId(account);

      if (accountId) {
        map.set(accountId, account);
      }
    });

    return map;
  }, [accounts]);

  const typeOptions = useMemo(() => {
    const values = eggs.map((egg) => String(getEggTypeValue(egg))).filter(Boolean);
    const normalizedValues = values.length ? values : ["1", "2"];

    return buildOptionRows(normalizedValues, getEggTypeLabel);
  }, [eggs]);

  const statusOptions = useMemo(
    () => buildOptionRows(eggs.map((egg) => egg.status), getStatusLabel),
    [eggs]
  );

  const filteredEggs = useMemo(() => {
    return [...eggs]
      .filter((egg) => {
        const type = String(getEggTypeValue(egg));
        const status = normalizeText(egg.status);

        if (typeFilter && type !== typeFilter) {
          return false;
        }

        if (statusFilter && normalizeKey(status) !== normalizeKey(statusFilter)) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        const order = getEggOrder(egg, orderById);
        const pool = getEggPool(egg, poolById);
        const account = getEggAccount(egg, accountById);
        const searchText = [
          getEggId(egg),
          egg.order_id,
          getOrderCode(order),
          getEggTypeLabel(type),
          getStatusLabel(status),
          getPoolName(pool),
          pool?.tier,
          getAccountName(account),
          getAccountMeta(account),
          egg.account_id,
        ]
          .map(normalizeKey)
          .join(" ");

        return searchText.includes(normalizedKeyword);
      })
      .sort((left, right) => {
        const leftDate = getValidDate(left.created_at, left.updated_at);
        const rightDate = getValidDate(right.created_at, right.updated_at);

        return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
      });
  }, [
    accountById,
    eggs,
    normalizedKeyword,
    orderById,
    poolById,
    statusFilter,
    typeFilter,
  ]);

  const openHatchTimeModal = (egg) => {
    setEditingEgg(egg);
    setHatchTimeValue(toDateTimeInputValue(egg.hatch_at || egg.hatchAt));
    setMessage("");
  };

  const closeHatchTimeModal = () => {
    if (isSaving) return;

    setEditingEgg(null);
    setMessage("");
  };

  const saveHatchTime = async () => {
    const eggId = getEggId(editingEgg);
    const hatchAt = fromDateTimeInputValue(hatchTimeValue);

    if (!eggId || !hatchAt || isSaving) {
      setMessage("Vui lòng chọn thời gian nở hợp lệ.");
      return;
    }

    setIsSaving(true);

    try {
      const savedEgg =
        (await onUpdateEggHatchTime?.(eggId, hatchAt)) || {
          ...editingEgg,
          hatch_at: hatchAt,
          status: new Date(hatchAt).getTime() > Date.now() ? "incubating" : "ready",
        };

      onSaveRecord?.("eggs", savedEgg);
      setEditingEgg(null);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Không thể cập nhật giờ ấp trứng.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-panel admin-egg-manager-panel">
      <div className="admin-egg-toolbar">
        <label className="admin-egg-search">
          <FaMagnifyingGlass aria-hidden="true" />
          <span>Tìm kiếm</span>
          <input
            type="search"
            placeholder="Tìm theo ID trứng, mã đơn..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <div className="admin-egg-toolbar__actions">
          <select
            aria-label="Lọc loại trứng"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">Mọi loại trứng</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc trạng thái trứng"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Mọi trạng thái</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" disabled={isRefreshing} onClick={onRefresh}>
            <FaRotateRight aria-hidden="true" />
            {isRefreshing ? "Đang tải" : "Làm mới"}
          </button>
        </div>
      </div>

      <div className="admin-table-wrap admin-egg-table-wrap">
        <table className="admin-table admin-egg-table">
          <thead>
            <tr>
              <th>ID Trứng</th>
              <th>Loại Trứng</th>
              <th>Trạng Thái</th>
              <th>Mã Đơn Hàng</th>
              <th>Bể Quà Tặng</th>
              <th>Tài Khoản Nhận</th>
              <th>Ngày Nở Dự Kiến</th>
              <th>Ngày Tạo</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredEggs.length ? (
              filteredEggs.map((egg) => {
                const type = getEggTypeValue(egg);
                const order = getEggOrder(egg, orderById);
                const pool = getEggPool(egg, poolById);
                const account = getEggAccount(egg, accountById);
                const poolName = getPoolName(pool);
                const accountName = getAccountName(account);
                const accountMeta = getAccountMeta(account);

                return (
                  <tr key={getEggId(egg)}>
                    <td className="admin-egg-id">{getEggId(egg) || "-"}</td>
                    <td>
                      <span className={`admin-egg-type is-${getEggTypeClass(type)}`}>
                        {getEggTypeLabel(type)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-egg-status ${getStatusClass(egg.status)}`}>
                        {getStatusLabel(egg.status)}
                      </span>
                    </td>
                    <td>
                      <strong className="admin-egg-order-code">
                        {getOrderCode(order) || egg.order_id || "-"}
                      </strong>
                    </td>
                    <td>
                      {poolName ? (
                        <span>
                          {poolName}
                          {pool?.tier ? ` (${pool.tier})` : ""}
                        </span>
                      ) : (
                        egg.gift_pool_id || "-"
                      )}
                    </td>
                    <td>
                      {accountName || egg.account_id ? (
                        <span className="admin-egg-account">
                          <strong>{accountName || egg.account_id}</strong>
                          {accountMeta ? <small>{accountMeta}</small> : null}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{formatDateTime(egg.hatch_at)}</td>
                    <td>{formatDateTime(egg.created_at)}</td>
                    <td>
                      {canEditHatchTime(egg) ? (
                        <button
                          type="button"
                          className="admin-mini-button admin-egg-hatch-button"
                          onClick={() => openHatchTimeModal(egg)}
                        >
                          <FaClock aria-hidden="true" />
                          Sửa Giờ Ấp
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>Không tìm thấy trứng phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingEgg ? (
        <div className="admin-modal-backdrop">
          <section
            className="admin-panel admin-modal admin-egg-hatch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-egg-hatch-title"
          >
            <div className="admin-egg-hatch-modal__head">
              <h2 id="admin-egg-hatch-title">Chỉnh Sửa Thời Gian Nở</h2>
              <button
                type="button"
                aria-label="Đóng"
                disabled={isSaving}
                onClick={closeHatchTimeModal}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <div className="admin-egg-hatch-note">
              <strong>Lưu ý:</strong>
              <ul>
                <li>Thời gian được chọn là thời gian mà trứng sẽ có thể được mở và nhận được phần thưởng.</li>
                <li>Nhấn nút Nở ngay rồi xác nhận để trứng có thể được mở mà không cần chờ đợi.</li>
              </ul>
            </div>

            <label className="admin-egg-hatch-field">
              Thời gian nở mới
              <span>
                <input
                  type="datetime-local"
                  value={hatchTimeValue}
                  onChange={(event) => setHatchTimeValue(event.target.value)}
                />
                <button
                  type="button"
                  className="admin-light-button"
                  disabled={isSaving}
                  onClick={() => setHatchTimeValue(toDateTimeInputValue(new Date()))}
                >
                  <FaBolt aria-hidden="true" />
                  Nở ngay
                </button>
              </span>
            </label>

            {message ? <p className="admin-crud-message">{message}</p> : null}

            <div className="admin-crud-actions admin-egg-hatch-actions">
              <button
                type="button"
                className="admin-light-button"
                disabled={isSaving}
                onClick={closeHatchTimeModal}
              >
                Hủy
              </button>
              <button type="button" disabled={isSaving} onClick={saveHatchTime}>
                {isSaving ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
