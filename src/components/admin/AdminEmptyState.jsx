export function AdminEmptyState({
  actionLabel,
  details = [],
  eyebrow,
  isActionLoading = false,
  loadingLabel = "Đang tải dữ liệu",
  onAction,
  title,
  description,
}) {
  return (
    <section className="admin-panel admin-empty-state">
      <div className="admin-empty-state__copy">
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {details.length ? (
          <div className="admin-empty-state__meta">
            {details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </div>
        ) : null}
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          className="admin-light-button"
          disabled={isActionLoading}
          onClick={onAction}
        >
          {isActionLoading ? loadingLabel : actionLabel}
        </button>
      ) : null}
    </section>
  );
}
