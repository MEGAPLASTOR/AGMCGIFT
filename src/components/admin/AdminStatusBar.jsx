export function AdminStatusBar({ title, counts }) {
  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h2>{title}</h2>
      </div>
      <div className="admin-status-bars">
        {entries.map(([label, value]) => (
          <div className="admin-status-row" key={label}>
            <span>{label}</span>
            <div>
              <i style={{ width: `${(value / total) * 100}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
