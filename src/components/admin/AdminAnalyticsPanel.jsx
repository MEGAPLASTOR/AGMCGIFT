function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Number(value || 0)))}%`;
}

function getAlertClassName(tone) {
  return `admin-alert-card admin-alert-card--${tone || "blue"}`;
}

export function AdminAnalyticsPanel({ analytics }) {
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
