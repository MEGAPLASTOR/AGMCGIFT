import { AccountRewardCard } from "./AccountRewardCard";
import { RewardTierEggBadge } from "./RewardTierEggBadge";

export function InstantRewardPage({
  redemptionInfo,
  onReset,
  backLabel = "Quay lại xem trứng",
}) {
  return (
    <section className="gift-panel gift-panel--result">
      <div className="incubating-page__hero">
        <div>
          <p className="eyebrow">Trứng đã nở</p>
          <h2>Nhận acc thành công</h2>
        </div>
        <RewardTierEggBadge redemptionInfo={redemptionInfo} />
      </div>

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
        {backLabel}
      </button>
    </section>
  );
}
