import { useMemo, useState } from "react";

const EMPTY_TIME_SERIES = {
  points: [],
};

const TIME_RANGE_OPTIONS = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year", label: "Năm" },
];

const TIME_CHART_SERIES = [
  { key: "orders", label: "Đơn", tone: "orders" },
  { key: "eggs", label: "Trứng cấp", tone: "eggs" },
  { key: "claimedEggs", label: "Đã nhận", tone: "claimed" },
  { key: "incubatingEggs", label: "Đang ấp", tone: "incubating" },
];

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Number(value || 0)))}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function getAlertClassName(tone) {
  return `admin-alert-card admin-alert-card--${tone || "blue"}`;
}

function getBarStyle(value, maxValue) {
  const numberValue = Number(value || 0);

  if (!numberValue || !maxValue) {
    return { "--bar-height": "3px" };
  }

  return {
    "--bar-height": `${Math.max(10, Math.round((numberValue / maxValue) * 100))}%`,
  };
}

export function AdminAnalyticsPanel({ analytics }) {
  const [selectedRange, setSelectedRange] = useState("day");
  const selectedSeries =
    analytics?.timeSeries?.[selectedRange] ||
    analytics?.timeSeries?.day ||
    EMPTY_TIME_SERIES;
  const timePoints = selectedSeries.points || EMPTY_TIME_SERIES.points;
  const chartTotals = useMemo(
    () =>
      timePoints.reduce(
        (result, point) => {
          TIME_CHART_SERIES.forEach((series) => {
            const value = Number(point[series.key] || 0);
            result[series.key] += value;
            result.maxValue = Math.max(result.maxValue, value);
          });

          return result;
        },
        {
          orders: 0,
          eggs: 0,
          claimedEggs: 0,
          incubatingEggs: 0,
          maxValue: 0,
        }
      ),
    [timePoints]
  );

  if (!analytics) {
    return null;
  }

  return (
    <section className="admin-analytics">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Analytics</p>
          <h2>Trung tâm vận hành</h2>
        </div>
        <span>
          Theo dõi rủi ro khách, tồn kho quà, mapping sản phẩm và luồng nhận trứng
        </span>
      </div>

      <div className="admin-alert-grid">
        {analytics.alerts.map((alert) => (
          <article className={getAlertClassName(alert.tone)} key={alert.key}>
            <span>{alert.label}</span>
            <strong>{alert.value}</strong>
            <small>{alert.note}</small>
          </article>
        ))}
      </div>

      <section className="admin-analytics-band admin-time-chart">
        <div className="admin-panel__head admin-time-chart__head">
          <div>
            <h2>Biểu đồ theo thời gian thật</h2>
            <span>Gom theo ngày tạo/cập nhật thật của đơn và trứng</span>
          </div>
          <div className="admin-time-tabs" role="group" aria-label="Chọn khoảng thời gian">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                aria-pressed={selectedRange === option.key}
                className={selectedRange === option.key ? "is-active" : ""}
                key={option.key}
                onClick={() => setSelectedRange(option.key)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-time-chart__summary">
          {TIME_CHART_SERIES.map((series) => (
            <article key={series.key}>
              <span>{series.label}</span>
              <strong>{formatNumber(chartTotals[series.key])}</strong>
            </article>
          ))}
        </div>

        <div className="admin-time-chart__legend">
          {TIME_CHART_SERIES.map((series) => (
            <span key={series.key}>
              <i className={`admin-time-chart__dot admin-time-chart__dot--${series.tone}`} />
              {series.label}
            </span>
          ))}
        </div>

        {chartTotals.maxValue ? (
          <div className="admin-time-chart__plot-wrap">
            <div
              aria-label={`Biểu đồ ${selectedSeries.label || "thời gian"} của đơn và trứng`}
              className="admin-time-chart__plot"
              role="img"
              style={{ "--point-count": String(Math.max(timePoints.length, 1)) }}
            >
              {timePoints.map((point) => (
                <article className="admin-time-chart__bar-group" key={point.key}>
                  <div className="admin-time-chart__bars">
                    {TIME_CHART_SERIES.map((series) => {
                      const value = Number(point[series.key] || 0);

                      return (
                        <span
                          className={`admin-time-chart__bar admin-time-chart__bar--${series.tone}`}
                          key={series.key}
                          style={getBarStyle(value, chartTotals.maxValue)}
                          title={`${series.label}: ${formatNumber(value)}`}
                        >
                          {value ? <em>{formatNumber(value)}</em> : null}
                        </span>
                      );
                    })}
                  </div>
                  <strong>{point.label}</strong>
                  <small>
                    {formatNumber(point.orders)} đơn / {formatNumber(point.eggs)} trứng
                  </small>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="admin-analytics-empty">Chưa có dữ liệu thời gian để vẽ biểu đồ.</p>
        )}
      </section>

      <div className="admin-analytics-grid">
        <section className="admin-analytics-band admin-analytics-band--wide">
          <div className="admin-panel__head">
            <div>
              <h2>Phễu xử lý đơn và trứng</h2>
              <span>Đơn hợp lệ, trứng đã cấp, đang ấp và đã nhận quà</span>
            </div>
          </div>
          <div className="admin-funnel">
            {analytics.funnel.map((step) => (
              <article key={step.label}>
                <div>
                  <strong>{step.value}</strong>
                  <span>{step.label}</span>
                </div>
                <em>{formatPercent(step.percent)}</em>
                <i style={{ width: formatPercent(step.percent) }} />
              </article>
            ))}
          </div>
        </section>

        <section className="admin-analytics-band">
          <div className="admin-panel__head">
            <div>
              <h2>Chống gian lận</h2>
              <span>Cảnh báo từ return streak và đơn bị chặn</span>
            </div>
          </div>
          <div className="admin-risk-grid">
            <article>
              <span>Khách cảnh báo</span>
              <strong>{analytics.risk.warningCustomers}</strong>
              <small>{formatPercent(analytics.risk.warningRate)} tổng khách</small>
            </article>
            <article>
              <span>Khách bị khóa</span>
              <strong>{analytics.risk.bannedCustomers}</strong>
              <small>{formatPercent(analytics.risk.bannedRate)} tổng khách</small>
            </article>
            <article>
              <span>Đơn bị chặn</span>
              <strong>{formatPercent(analytics.risk.blockedOrderRate)}</strong>
              <small>Pending / Cancel / hoàn trả</small>
            </article>
          </div>
        </section>
      </div>

      <div className="admin-analytics-grid">
        <section className="admin-analytics-band">
          <div className="admin-panel__head">
            <div>
              <h2>Kho quà theo tier</h2>
              <span>Ưu tiên bổ sung tier có tồn kho available thấp</span>
            </div>
          </div>
          <div className="admin-tier-list">
            {analytics.inventoryByTier.length ? (
              analytics.inventoryByTier.map((tier) => (
                <article key={tier.tier}>
                  <div>
                    <strong>Tier {tier.tier}</strong>
                    <span>
                      {tier.availableAccounts}/{tier.totalAccounts} available
                    </span>
                  </div>
                  <i>
                    <b style={{ width: formatPercent(tier.availableRate) }} />
                  </i>
                  <em>{tier.pools} bể</em>
                </article>
              ))
            ) : (
              <p className="admin-analytics-empty">Chưa có dữ liệu kho quà.</p>
            )}
          </div>
        </section>

        <section className="admin-analytics-band">
          <div className="admin-panel__head">
            <div>
              <h2>Sức khỏe mapping</h2>
              <span>Sản phẩm không mapping sẽ không cấp trứng</span>
            </div>
          </div>
          <div className="admin-mapping-health">
            <strong>{formatPercent(analytics.mapping.mappedRate)}</strong>
            <span>
              {analytics.mapping.mappedProducts}/{analytics.mapping.totalProducts} sản phẩm đã mapping
            </span>
            <small>{analytics.mapping.mappingRules} quy tắc sản phẩm - trứng</small>
            <i>
              <b style={{ width: formatPercent(analytics.mapping.mappedRate) }} />
            </i>
          </div>
        </section>
      </div>
    </section>
  );
}
