export function AdminMetricCard({ label, value, note, tone = "default" }) {
  return (
    <article className={`admin-metric admin-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
