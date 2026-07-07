import { useState } from "react";
import { FaMagnifyingGlass, FaRotateRight } from "react-icons/fa6";
import { getDeliveryStatusKind } from "../../api/eggs/utils/getDeliveryStatusKind";

const ORDER_CHART_COLORS = {
  success: "#ff7a29",
  cancelled: "#ff6262",
  pending: "#4da2ff",
};

const EGG_CHART_COLORS = {
  claimed: "#6bf0a5",
  pending: "#ffd66b",
  cancelled: "#ff8a80",
};

const TIER_ORDER = ["A", "B", "C", "D", "E"];
const RANGE_OPTIONS = ["day", "week", "month"];
const CHART_SERIES = [
  {
    key: "orders",
    label: "Orders",
    color: "#ff7a29",
    fill: "rgba(255, 122, 41, 0.22)",
  },
  {
    key: "eggs",
    label: "Eggs",
    color: "#4da2ff",
  },
  {
    key: "claimedEggs",
    label: "Claimed",
    color: "#70f0a4",
    dashArray: "8 7",
  },
];

const CHART_WIDTH = 880;
const CHART_HEIGHT = 280;
const CHART_PADDING = {
  top: 18,
  right: 18,
  bottom: 34,
  left: 22,
};

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
    return "#2d3656 0deg 360deg";
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
  const deliveryKind = getDeliveryStatusKind(status);

  if (deliveryKind === "returned") {
    return "cancelled";
  }

  if (deliveryKind === "delivered") {
    return "success";
  }

  if (
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("huy") ||
    normalizedStatus.includes("hoan") ||
    normalizedStatus.includes("refund")
  ) {
    return "cancelled";
  }

  if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("success") ||
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
      status.includes("hoan") ||
      status.includes("refund")
  );
  const success =
    countMatching(
      counts,
      (status) =>
        getDeliveryStatusKind(status) === "delivered" ||
        status.includes("paid") ||
        status.includes("success") ||
        status.includes("delivered")
    ) || Number(summary.paidOrders || 0);
  const pending = Math.max(
    0,
    Number(summary.totalOrders || 0) - success - cancelled
  );

  return [
    {
      key: "success",
      label: "Paid",
      value: success,
      color: ORDER_CHART_COLORS.success,
    },
    {
      key: "cancelled",
      label: "Cancel",
      value: cancelled,
      color: ORDER_CHART_COLORS.cancelled,
    },
    {
      key: "pending",
      label: "Pending",
      value: pending,
      color: ORDER_CHART_COLORS.pending,
    },
  ];
}

function getEggStatusRows(counts = {}, summary = {}) {
  const claimed = countMatching(
    counts,
    (status) =>
      status.includes("claimed") ||
      status.includes("opened") ||
      status.includes("hatched")
  );
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
      label: "Claimed",
      value: claimed,
      color: EGG_CHART_COLORS.claimed,
    },
    {
      key: "pending",
      label: "Incubating",
      value: pending,
      color: EGG_CHART_COLORS.pending,
    },
    {
      key: "cancelled",
      label: "Cancelled",
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
    const assigned =
      "assignedAccounts" in row
        ? Number(row.assignedAccounts || 0)
        : Math.max(0, total - available);

    return {
      tier,
      available,
      assigned,
      total,
    };
  });
}

function buildPerformanceRows(summary = {}, analytics = {}) {
  return [
    {
      key: "mapping",
      label: "Mapping",
      value: Number(analytics.mapping?.mappedRate || 0),
      detail: `${formatNumber(analytics.mapping?.mappedProducts || 0)}/${formatNumber(
        analytics.mapping?.totalProducts || 0
      )} sản phẩm`,
    },
    {
      key: "delivery",
      label: "Paid orders",
      value: Number(
        summary.totalOrders
          ? Math.round((summary.paidOrders / summary.totalOrders) * 100)
          : 0
      ),
      detail: `${formatNumber(summary.paidOrders)} đơn đã đi tới bước nhận trứng`,
    },
    {
      key: "inventory",
      label: "Inventory",
      value: Number(
        summary.totalAccounts
          ? Math.round((summary.availableAccounts / summary.totalAccounts) * 100)
          : 0
      ),
      detail: `${formatNumber(summary.availableAccounts)} acc available`,
    },
  ];
}

function buildServerRows(tierRows) {
  return tierRows
    .filter((row) => row.total > 0)
    .slice(0, 4)
    .map((row) => ({
      ...row,
      ratio: row.total ? Math.round((row.available / row.total) * 100) : 0,
      sparkValues: [
        row.available,
        Math.max(row.total - row.assigned, 0),
        row.assigned,
        row.total,
      ],
    }));
}

function getChartCoordinates(points, key, maxValue) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  return points.map((point, index) => {
    const value = Number(point[key] || 0);
    const x = CHART_PADDING.left + step * index;
    const y =
      CHART_PADDING.top +
      innerHeight -
      (value / Math.max(1, maxValue)) * innerHeight;

    return {
      x,
      y,
      value,
    };
  });
}

function buildLinePath(points) {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function buildAreaPath(points) {
  if (!points.length) {
    return "";
  }

  const bottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const line = buildLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${line} L ${last.x.toFixed(2)} ${bottom.toFixed(2)} L ${first.x.toFixed(
    2
  )} ${bottom.toFixed(2)} Z`;
}

function Sparkline({ values, color = "#8fd2ff" }) {
  const width = 82;
  const height = 28;
  const maxValue = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = step * index;
    const y = height - (Number(value || 0) / maxValue) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      aria-hidden="true"
      className="admin-analytics-pro__sparkline"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function OverviewCard({ summary }) {
  return (
    <article className="admin-analytics-pro__card admin-analytics-pro__card--hero">
      <span className="admin-analytics-pro__card-kicker">Orders Today</span>
      <strong>{formatNumber(summary.totalOrders)}</strong>
      <div className="admin-analytics-pro__mini-metrics">
        <small>
          <b>{formatNumber(summary.paidOrders)}</b>
          Paid
        </small>
        <small>
          <b>{formatNumber(summary.totalEggs)}</b>
          Eggs
        </small>
        <small>
          <b>{formatNumber(summary.availableAccounts)}</b>
          Accounts
        </small>
      </div>
    </article>
  );
}

function BreakdownCard({ rows }) {
  return (
    <article className="admin-analytics-pro__card">
      <div className="admin-analytics-pro__card-head">
        <span>Revenue Breakdown</span>
      </div>
      <div className="admin-dark-chart-hover admin-analytics-pro__donut-wrap" tabIndex={0}>
        <div
          className="admin-dark-donut admin-analytics-pro__donut"
          style={{ "--chart-gradient": buildConicGradient(rows) }}
        >
          <span />
        </div>
        <div className="admin-dark-chart-tooltip" role="tooltip">
          <strong>Tình trạng đơn hàng</strong>
          <ul>
            {rows.map((row) => (
              <li key={row.key}>
                <span>
                  <i style={{ background: row.color }} />
                  {row.label}
                </span>
                <b>{formatNumber(row.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="admin-dark-chart-legend admin-analytics-pro__legend">
        {rows.map((row) => (
          <span key={row.key}>
            <i style={{ background: row.color }} />
            {row.label}
          </span>
        ))}
      </div>
    </article>
  );
}

function PerformanceCard({ rows }) {
  return (
    <article className="admin-analytics-pro__card">
      <div className="admin-analytics-pro__card-head">
        <span>App Performance</span>
      </div>
      <div className="admin-analytics-pro__progress-list">
        {rows.map((row) => (
          <article key={row.key}>
            <div>
              <strong>{row.label}</strong>
              <span>{row.value}%</span>
            </div>
            <i>
              <em style={{ width: `${Math.max(6, row.value)}%` }} />
            </i>
            <small>{row.detail}</small>
          </article>
        ))}
      </div>
    </article>
  );
}

function ServerCard({ rows }) {
  return (
    <article className="admin-analytics-pro__card">
      <div className="admin-analytics-pro__card-head">
        <span>Server Overview</span>
      </div>
      <div className="admin-analytics-pro__server-list">
        {rows.length ? (
          rows.map((row) => (
            <article key={row.tier}>
              <div>
                <strong>Tier {row.tier}</strong>
                <span>
                  {formatNumber(row.available)}/{formatNumber(row.total)} available
                </span>
              </div>
              <Sparkline values={row.sparkValues} />
            </article>
          ))
        ) : (
          <p>Chưa có dữ liệu tier.</p>
        )}
      </div>
    </article>
  );
}

function TimeSeriesChart({ title, range, timeSeries, isRefreshing, onRefresh }) {
  const points = timeSeries?.points || [];
  const chartMaxValue = Math.max(
    5,
    ...points.flatMap((point) =>
      CHART_SERIES.map((series) => Number(point[series.key] || 0))
    )
  );
  const coordinatesByKey = Object.fromEntries(
    CHART_SERIES.map((series) => [
      series.key,
      getChartCoordinates(points, series.key, chartMaxValue),
    ])
  );
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
    Math.round(chartMaxValue * ratio)
  );

  return (
    <section className="admin-analytics-pro__chart-card">
      <div className="admin-analytics-pro__chart-head">
        <div>
          <span>{title}</span>
          <strong>{timeSeries?.label || range}</strong>
        </div>
        <button
          type="button"
          className="admin-light-button admin-analytics-pro__refresh"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <FaRotateRight aria-hidden="true" />
          {isRefreshing ? "Đang tải" : "Làm mới"}
        </button>
      </div>

      <div className="admin-analytics-pro__chart-legend">
        {CHART_SERIES.map((series) => (
          <span key={series.key}>
            <i style={{ background: series.color }} />
            {series.label}
          </span>
        ))}
      </div>

      <div className="admin-analytics-pro__chart-wrap">
        <div className="admin-analytics-pro__chart-axis">
          {yTicks.map((tick) => (
            <span key={tick}>{formatNumber(tick)}</span>
          ))}
        </div>
        <div className="admin-analytics-pro__chart-stage">
          <svg
            aria-label="Analytics line chart"
            className="admin-analytics-pro__chart-svg"
            preserveAspectRatio="none"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            {yTicks.map((tick, index) => {
              const innerHeight =
                CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
              const y =
                CHART_PADDING.top +
                (innerHeight / Math.max(1, yTicks.length - 1)) * index;

              return (
                <line
                  key={tick}
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  className="admin-analytics-pro__chart-gridline"
                />
              );
            })}

            {CHART_SERIES.map((series) => {
              const coordinates = coordinatesByKey[series.key] || [];

              return (
                <g key={series.key}>
                  {series.fill ? (
                    <path
                      d={buildAreaPath(coordinates)}
                      fill={series.fill}
                    />
                  ) : null}
                  <path
                    d={buildLinePath(coordinates)}
                    fill="none"
                    stroke={series.color}
                    strokeDasharray={series.dashArray || undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
          </svg>

          <div
            className="admin-analytics-pro__chart-labels"
            style={{
              gridTemplateColumns: `repeat(${Math.max(2, points.length)}, minmax(0, 1fr))`,
            }}
          >
            {points.map((point) => (
              <span key={point.key}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminAnalyticsPanel({
  dashboard,
  isRefreshing = false,
  onRefresh,
}) {
  const [orderSearch, setOrderSearch] = useState("");
  const [chartRange, setChartRange] = useState("day");
  const analytics = dashboard?.analytics;
  const summary = dashboard?.summary || {};
  const counts = dashboard?.counts || {};
  const latestOrders = dashboard?.latestOrders || [];
  const normalizedOrderSearch = normalizeStatus(orderSearch);
  const orderStatusRows = getOrderStatusRows(counts.orderStatus, summary);
  const eggStatusRows = getEggStatusRows(counts.eggStatus, summary);
  const tierRows = getTierRows(analytics?.inventoryByTier || []);
  const performanceRows = buildPerformanceRows(summary, analytics);
  const serverRows = buildServerRows(tierRows);
  const filteredOrders = normalizedOrderSearch
    ? latestOrders.filter((order) =>
        [
          order.code,
          order.customer,
          order.status,
          order.fulfillment,
          order.total,
          order.product,
          ...(order.products || []).flatMap((product) => [
            product.name,
            product.sku,
            product.quantity,
          ]),
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
    <section className="admin-analytics admin-analytics-pro">
      <div className="admin-analytics-pro__intro">
        <p>YOU ARE HERE &gt; AGMC &gt; Dashboard &gt; Analytics</p>
        <div>
          <h2>Analytics</h2>
          <span>
            Theo dõi trạng thái đơn hàng, trứng và kho account theo nhịp realtime.
          </span>
        </div>
      </div>

      <div className="admin-analytics-pro__overview">
        <OverviewCard summary={summary} />
        <BreakdownCard rows={orderStatusRows} />
        <PerformanceCard rows={performanceRows} />
        <ServerCard rows={serverRows} />
      </div>

      <div className="admin-analytics-pro__range">
        {RANGE_OPTIONS.map((range) => (
          <button
            key={range}
            type="button"
            className={chartRange === range ? "is-active" : ""}
            onClick={() => setChartRange(range)}
          >
            {analytics.timeSeries?.[range]?.label || range}
          </button>
        ))}
      </div>

      <TimeSeriesChart
        title="Daily Line Chart"
        range={chartRange}
        timeSeries={analytics.timeSeries?.[chartRange]}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      <section className="admin-dark-panel admin-dark-orders admin-analytics-pro__orders">
        <div className="admin-dark-orders__toolbar">
          <label>
            <FaMagnifyingGlass aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm mã đơn, khách hàng, SKU..."
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
            />
          </label>
          <div className="admin-analytics-pro__orders-meta">
            <span>
              Eggs claimed:{" "}
              <b>{formatNumber(eggStatusRows.find((row) => row.key === "claimed")?.value)}</b>
            </span>
            <span>
              Incubating:{" "}
              <b>{formatNumber(eggStatusRows.find((row) => row.key === "pending")?.value)}</b>
            </span>
          </div>
        </div>

        <div className="admin-dark-table-wrap">
          <table className="admin-dark-orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Sản phẩm</th>
                <th>Ngày tạo</th>
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
                      <td>
                        {order.products?.length ? (
                          <div className="admin-dark-order-products">
                            {order.products.map((product, index) => (
                              <div
                                className="admin-dark-order-product"
                                key={`${order.code}-${product.sku}-${index}`}
                              >
                                <div className="admin-dark-order-product__image">
                                  {product.imageUrl ? (
                                    <img
                                      alt={product.name || "SP"}
                                      src={product.imageUrl}
                                    />
                                  ) : (
                                    <span>SP</span>
                                  )}
                                </div>
                                <div>
                                  <strong>{product.name || "-"}</strong>
                                  <span>
                                    SKU: {product.sku || "-"} • SL:{" "}
                                    {formatNumber(product.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          order.product || "-"
                        )}
                      </td>
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
