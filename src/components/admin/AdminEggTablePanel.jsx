import { useEffect, useMemo, useState } from "react";
import { FaBolt, FaMagnifyingGlass, FaRotateRight } from "react-icons/fa6";

const EMPTY_ROWS = [];
const FAST_HATCH_MINUTES = 3;

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

function canFastApproveEgg(egg) {
  const status = normalizeKey(egg?.status);

  return (
    getEggTypeValue(egg) === 2 &&
    getEggId(egg) &&
    ![
      "ready",
      "claimed",
      "hatched",
      "opened",
      "cancelled",
      "canceled",
      "invalidated",
    ].includes(
      status
    )
  );
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
  onSaveRecord,
  onRefresh,
  tables,
}) {
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setMessage(""), 2800);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const approveFastHatch = (egg) => {
    const hatchAt = new Date(Date.now() + FAST_HATCH_MINUTES * 60 * 1000).toISOString();
    const nextEgg = {
      ...egg,
      hatch_at: hatchAt,
      status: "incubating",
      updated_at: new Date().toISOString(),
    };

    onSaveRecord?.("eggs", nextEgg);
    setMessage(`Đã duyệt mở nhanh sau ${FAST_HATCH_MINUTES} phút.`);
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
                    <td>{accountName || egg.account_id || "-"}</td>
                    <td>{formatDateTime(egg.hatch_at)}</td>
                    <td>{formatDateTime(egg.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-mini-button admin-egg-fast-button"
                        disabled={!canFastApproveEgg(egg)}
                        onClick={() => approveFastHatch(egg)}
                      >
                        <FaBolt aria-hidden="true" />
                        Duyệt 3 phút
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8}>Không tìm thấy trứng phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {message ? <p className="admin-crud-message admin-fade-message">{message}</p> : null}
    </section>
  );
}
