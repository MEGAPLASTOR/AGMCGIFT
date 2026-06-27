export function AdminWorkflow({ steps }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h2>Luồng xử lý</h2>
        <span>theo luồng KiotViet</span>
      </div>
      <div className="admin-workflow">
        {steps.map((step, index) => (
          <article key={step.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <em>{step.value}</em>
            <small>{step.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
