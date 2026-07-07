import { AccountRewardCard } from "./AccountRewardCard";
import { RewardTierEggBadge } from "./RewardTierEggBadge";

function getRewardAccounts(redemptionInfo) {
  return Array.isArray(redemptionInfo?.accounts) && redemptionInfo.accounts.length
    ? redemptionInfo.accounts
    : redemptionInfo?.reward
      ? [redemptionInfo.reward]
      : [];
}

function getPositiveNumber(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function InstantRewardPage({
  redemptionInfo,
  onReset,
  backLabel = "Quay lại xem trứng",
}) {
  const accounts = getRewardAccounts(redemptionInfo);

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
        {accounts.length > 1 ? <span>Số acc: {accounts.length}</span> : null}
        {getPositiveNumber(redemptionInfo.totalCount) ? (
          <span>Tổng trứng: {redemptionInfo.totalCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.claimedCount) ? (
          <span>Đã mở: {redemptionInfo.claimedCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.hatchingCount) ? (
          <span>Đang ấp: {redemptionInfo.hatchingCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.stuckCount) ? (
          <span>Bị kẹt: {redemptionInfo.stuckCount}</span>
        ) : null}
      </div>

      {redemptionInfo.message ? (
        <p className="message message--success">{redemptionInfo.message}</p>
      ) : null}
      {getPositiveNumber(redemptionInfo.stuckCount) ? (
        <p className="message message--warning">
          Có {redemptionInfo.stuckCount} trứng chưa mở được do thiếu tài khoản trong pool hoặc chưa có pool liên kết.
        </p>
      ) : null}

      <div className="account-reward-list">
        {accounts.map((account, index) => (
          <AccountRewardCard
            key={`${account.taiKhoan || account.username || "reward"}-${index}`}
            account={account}
            title={accounts.length > 1 ? `Acc nhận được #${index + 1}` : "Acc nhận được"}
          />
        ))}
      </div>

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
