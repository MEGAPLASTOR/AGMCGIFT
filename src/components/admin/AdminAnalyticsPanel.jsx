import { useState } from "react";
import { FaMagnifyingGlass, FaRotateRight } from "react-icons/fa6";

const ORDER_CHART_COLORS = {
  success: "#82aef4",
  cancelled: "#f28b83",
  pending: "#82aef4",
};

const EGG_CHART_COLORS = {
  claimed: "#82c993",
  pending: "#ffd966",
  cancelled: "#f28b83",
};

const TIER_ORDER = ["A", "B", "C", "D", "E"];

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase();
}

function countMatching(counts = {}, matcher) {
  return Object.entries(counts).reduce((total, [key, value]) => {
    return matcher(normalizeStatus(key)) ? total + Number(value || 0) : total;
  }, 0);
}

function buildConicGradient(items) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (!total) {
    return "#3a3f47 0deg 360deg";
  }

  let cursor = 0;

  return items
    .map((item) => {
      const degrees = (Number(item.value || 0) / total) * 360;
      const start = cursor;
      const end = cursor + degrees;
      cursor = end;

      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");
}

function getStatusTone(status) {
  const normalizedStatus = normalizeStatus(status);

  if (
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("huy") ||
    normalizedStatus.includes("hoàn") ||
    normalizedStatus.includes("refund")
  ) {
    return "cancelled";
  }

  if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("success") ||
    normalizedStatus.includes("giao") ||
    normalizedStatus.includes("delivered")
  ) {
    return "success";
  }

  return "pending";
}

function getOrderStatusRows(counts = {}, summary = {}) {
  const cancelled = countMatching(
    counts,
    (status) =>
      status.includes("cancel") ||
      status.includes("huy") ||
      status.includes("hoàn") ||
      status.includes("refund")
  );
  const success =
    countMatching(
      counts,
      (status) =>
        status.includes("paid") ||
        status.includes("success") ||
        status.includes("delivered") ||
        status.includes("giao")
    ) || Number(summary.paidOrders || 0);
  const pending = Math.max(
    0,
    Number(summary.totalOrders || 0) - success - cancelled
  );

  return [
    {
      key: "success",
      label: "Thành công",
      value: success,
      color: ORDER_CHART_COLORS.success,
    },
    {
      key: "cancelled",
      label: "Đã hủy",
      value: cancelled,
      color: ORDER_CHART_COLORS.cancelled,
    },
    {
      key: "pending",
      label: "Đang chờ",
      value: pending,
      color: ORDER_CHART_COLORS.pending,
    },
  ];
}

function getEggStatusRows(counts = {}, summary = {}) {
  const claimed =
    countMatching(
      counts,
      (status) =>
        status.includes("claimed") ||
        status.includes("opened") ||
        status.includes("hatched")
    ) || Number(summary.readyEggs || 0);
  const cancelled = countMatching(
    counts,
    (status) =>
      status.includes("cancel") ||
      status.includes("invalid") ||
      status.includes("huy")
  );
  const pending = Math.max(
    0,
    Number(summary.totalEggs || 0) - claimed - cancelled
  );

  return [
    {
      key: "claimed",
      label: "Đã mở (Claimed)",
      value: claimed,
      color: EGG_CHART_COLORS.claimed,
    },
    {
      key: "pending",
      label: "Đang ấp (Pending)",
      value: pending,
      color: EGG_CHART_COLORS.pending,
    },
    {
      key: "cancelled",
      label: "Bị hủy (Cancelled)",
      value: cancelled,
      color: EGG_CHART_COLORS.cancelled,
    },
  ];
}

function getTierRows(inventoryByTier = []) {
  const rowByTier = new Map(
    inventoryByTier.map((row) => [normalizeText(row.tier).toUpperCase(), row])
  );
  const tiers = [
    ...TIER_ORDER,
    ...inventoryByTier
      .map((row) => normalizeText(row.tier).toUpperCase())
      .filter((tier) => tier && !TIER_ORDER.includes(tier)),
  ];

  return tiers.map((tier) => {
    const row = rowByTier.get(tier) || {};
    const available = Number(row.availableAccounts || 0);
    const total = Number(row.totalAccounts || 0);

    return {
      tier,
      available,
      assigned: Math.max(0, total - available),
    };
  });
}

function DashboardStat({ label, value, note }) {
  return (
    <article className="admin-dark-stat">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <small>{note}</small>
    </article>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="admin-dark-chart-legend">
      {items.map((item) => (
        <span key={item.key}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function AdminAnalyticsPanel({ dashboard, isRefreshing = false, onRefresh }) {
  const [orderSearch, setOrderSearch] = useState("");
  const analytics = dashboard?.analytics;
  const summary = dashboard?.summary || {};
  const counts = dashboard?.counts || {};
  const latestOrders = dashboard?.latestOrders || [];
  const normalizedOrderSearch = normalizeStatus(orderSearch);
  const orderStatusRows = getOrderStatusRows(counts.orderStatus, summary);
  const eggStatusRows = getEggStatusRows(counts.eggStatus, summary);
  const tierRows = getTierRows(analytics?.inventoryByTier || []);
  const maxTierValue = Math.max(
    1,
    ...tierRows.flatMap((row) => [row.available, row.assigned])
  );
  const filteredOrders = normalizedOrderSearch
    ? latestOrders.filter((order) =>
        [
          order.code,
          order.customer,
          order.status,
          order.fulfillment,
          order.total,
          order.product,
          order.createdAt,
        ]
          .map(normalizeStatus)
          .join(" ")
          .includes(normalizedOrderSearch)
      )
    : latestOrders;

  if (!dashboard || !analytics) {
    return null;
  }

  return (
    <section className="admin-analytics admin-dark-analytics">
      <div className="admin-dark-analytics__titlebar">
        <h2>Đơn Hàng KiotViet & Thống Kê Tổng Quan</h2>
      </div>

      <div className="admin-dark-stat-grid">
        <DashboardStat
          label="Tổng đơn hàng"
          note="Đơn hàng đồng bộ từ KiotViet"
          value={summary.totalOrders}
        />
        <DashboardStat
          label="Tổng quà trứng"
          note="Số lượng trứng đã phát hành"
          value={summary.totalEggs}
        />
        <DashboardStat
          label="Tài khoản quà sẵn có"
          note="Tài khoản vip còn trong kho"
          value={summary.availableAccounts}
        />
        <DashboardStat
          label="Tổng khách hàng"
          note="Khách hàng được ghi nhận"
          value={summary.totalCustomers}
        />
      </div>

      <div className="admin-dark-chart-grid">
        <section className="admin-dark-panel admin-dark-chart-card">
          <h3>Trạng thái đơn hàng</h3>
          <div
            className="admin-dark-donut"
            style={{ "--chart-gradient": buildConicGradient(orderStatusRows) }}
          >
            <span />
          </div>
          <ChartLegend items={orderStatusRows} />
        </section>

        <section className="admin-dark-panel admin-dark-chart-card">
          <h3>Tình trạng ấp trứng</h3>
          <div
            className="admin-dark-pie"
            style={{ "--chart-gradient": buildConicGradient(eggStatusRows) }}
          />
          <ChartLegend items={eggStatusRows} />
        </section>

        <section className="admin-dark-panel admin-dark-tier-card">
          <h3>Kho quà theo tier</h3>
          <div
            className="admin-dark-tier-chart"
            style={{ "--tier-max": String(maxTierValue) }}
          >
            <div className="admin-dark-tier-axis">
              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                <span key={ratio}>{Math.round(maxTierValue * ratio)}</span>
              ))}
            </div>
            <div className="admin-dark-tier-bars">
              {tierRows.map((row) => (
                <article key={row.tier}>
                  <div>
                    <span
                      className="is-available"
                      style={{
                        height: `${Math.max(
                          row.available ? 6 : 0,
                          Math.round((row.available / maxTierValue) * 100)
                        )}%`,
                      }}
                      title={`Có sẵn: ${formatNumber(row.available)}`}
                    />
                    <span
                      className="is-assigned"
                      style={{
                        height: `${Math.max(
                          row.assigned ? 6 : 0,
                          Math.round((row.assigned / maxTierValue) * 100)
                        )}%`,
                      }}
                      title={`Đã gán: ${formatNumber(row.assigned)}`}
                    />
                  </div>
                  <strong>Tier {row.tier}</strong>
                </article>
              ))}
            </div>
          </div>
          <div className="admin-dark-chart-legend">
            <span>
              <i style={{ background: "#82c993" }} />
              Có sẵn
            </span>
            <span>
              <i style={{ background: "#9aa4b2" }} />
              Đã gán
            </span>
          </div>
        </section>
      </div>

      <section className="admin-dark-panel admin-dark-orders">
        <div className="admin-dark-orders__toolbar">
          <label>
            <FaMagnifyingGlass aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm kiếm đơn hàng, khách hàng..."
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
            />
          </label>
          <button type="button" disabled={isRefreshing} onClick={onRefresh}>
            <FaRotateRight aria-hidden="true" />
            {isRefreshing ? "Đang tải" : "Làm mới"}
          </button>
        </div>

        <div className="admin-dark-table-wrap">
          <table className="admin-dark-orders-table">
            <thead>
              <tr>
                <th>Mã Đơn Hàng</th>
                <th>Khách Hàng</th>
                <th>Trạng Thái Giao Hàng</th>
                <th>Tổng Tiền (VND)</th>
                <th>Sản Phẩm Trong Đơn</th>
                <th>Ngày Tạo Đơn</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length ? (
                filteredOrders.map((order) => {
                  const statusLabel = order.fulfillment || order.status || "-";
                  const tone = getStatusTone(statusLabel || order.status);

                  return (
                    <tr key={`${order.code}-${order.createdAt}`}>
                      <td>
                        <strong>{order.code || "-"}</strong>
                      </td>
                      <td>{order.customer || "-"}</td>
                      <td>
                        <span className={`admin-dark-status is-${tone}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>{order.total || "0 ₫"}</td>
                      <td>{order.product || "-"}</td>
                      <td>{order.createdAt || order.updatedAt || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>Không có đơn hàng phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
