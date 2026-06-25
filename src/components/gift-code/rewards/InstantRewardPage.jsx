import { AccountRewardCard } from "./AccountRewardCard";

export function InstantRewardPage({ redemptionInfo, onReset }) {
  return (
    <section className="gift-panel gift-panel--result">
      <p className="eyebrow">Trứng vàng đã nở</p>
      <h2>Nhận acc thành công</h2>

      <div className="result-summary">
        <span>Code: {redemptionInfo.code}</span>
        <span>Sản phẩm: {redemptionInfo.productName}</span>
      </div>

      <AccountRewardCard reward={redemptionInfo.reward} />

      <p className="panel-note">
        Thời gian đổi:{" "}
        {new Date(redemptionInfo.redeemedAt).toLocaleString("vi-VN")}
      </p>

      <button type="button" onClick={onReset}>
        Nhập code khác
      </button>
    </section>
  );
}
