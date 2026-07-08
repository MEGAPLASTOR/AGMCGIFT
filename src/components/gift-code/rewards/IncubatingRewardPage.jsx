import { useCallback, useState } from "react";
import { AccountRewardCard } from "./AccountRewardCard";
import { CountdownTimer } from "./CountdownTimer";
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

export function IncubatingRewardPage({
  redemptionInfo,
  isClaiming = false,
  claimError,
  onClaimReady,
  onReset,
  backLabel = "Quay lại xem trứng",
}) {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const accounts = getRewardAccounts(redemptionInfo);
  const isReady = redemptionInfo.isReady || isCountdownComplete;
  const hasReward = accounts.length > 0;
  const eggName = "Trứng bí ẩn";
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
  }, []);

  return (
    <section className="gift-panel gift-panel--result gift-panel--incubating">
      <div className="incubating-page__hero">
        <div>
          <p className="eyebrow">{hasReward ? `${eggName} đã mở` : `${eggName} 15 ngày`}</p>
          <h2>
            {hasReward
              ? "Nhận acc thành công"
              : isReady
                ? "Mở để nhận acc"
                : "Đợi đủ cooldown để mở"}
          </h2>
        </div>
        {hasReward ? (
          <RewardTierEggBadge redemptionInfo={redemptionInfo} />
        ) : (
          <span className="mystery-egg mystery-egg--small" aria-hidden="true">
            ?
          </span>
        )}
      </div>

      <div className="result-summary">
        <span>Code: {redemptionInfo.code}</span>
        <span>Sản phẩm: {redemptionInfo.productName}</span>
        <span>Ngày giờ mở: {redemptionInfo.rewardDateTime}</span>
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

      {isReady ? (
        hasReward ? (
          <>
            <p className="message message--success">
              {redemptionInfo.message || `${eggName} đã nở. Đây là phần thưởng của bạn.`}
            </p>
            {getPositiveNumber(redemptionInfo.stuckCount) ? (
              <p className="message message--warning">
                Có {redemptionInfo.stuckCount} trứng chưa mở được do thiếu tài khoản trong pool hoặc chưa có pool liên kết.
              </p>
            ) : null}
            <div className="tier-reward-list">
              {accounts.map((account, index) => (
                <AccountRewardCard
                  key={`${account.taiKhoan || account.username || "reward"}-${index}`}
                  account={account}
                  title={
                    accounts.length > 1
                      ? `Acc nhận được #${index + 1}`
                      : "Acc nhận được"
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="message message--success">
              {eggName} đã hết cooldown. Bấm mở để nhận acc.
            </p>
            <button type="button" onClick={onClaimReady} disabled={isClaiming}>
              {isClaiming ? "Đang mở trứng..." : "Mở trứng bí ẩn"}
            </button>
          </>
        )
      ) : (
        <>
          <CountdownTimer
            targetDate={redemptionInfo.rewardReadyAt}
            onComplete={handleCountdownComplete}
          />
          <p className="message message--warning">
            Trứng đang được che lại. Khi đếm ngược về 0, bạn mới mở được phần thưởng.
          </p>
        </>
      )}

      {claimError ? <p className="message message--error">{claimError}</p> : null}

      <button type="button" onClick={onReset}>
        {backLabel}
      </button>
    </section>
  );
}
