export function StatusRail({ daysToWait }) {
  return (
    <aside className="status-rail" aria-label="Trạng thái ổ trứng">
      <div className="status-rail__item">
        <strong>Now</strong>
        <span>Nhận ngay</span>
      </div>
      <div className="status-rail__item status-rail__item--hot">
        <strong>{daysToWait}D</strong>
        <span>Ấp xịn</span>
      </div>
    </aside>
  );
}
