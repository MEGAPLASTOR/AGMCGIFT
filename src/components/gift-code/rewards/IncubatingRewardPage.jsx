import { useCallback, useState } from "react";
import { AccountRewardCard } from "./AccountRewardCard";
import { CountdownTimer } from "./CountdownTimer";
import { RewardTierEggBadge } from "./RewardTierEggBadge";

export function IncubatingRewardPage({
  redemptionInfo,
  isClaiming = false,
  claimError,
  onClaimReady,
  onReset,
  backLabel = "Quay lại xem trứng",
}) {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const isReady = redemptionInfo.isReady || isCountdownComplete;
  const hasReward = Boolean(redemptionInfo.reward || redemptionInfo.account);
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
          <span className="mystery-egg mystery-egg--small" aria-hidden="true">?</span>
        )}
      </div>

      <div className="result-summary">
        <span>Code: {redemptionInfo.code}</span>
        <span>Sản phẩm: {redemptionInfo.productName}</span>
        <span>Ngày giờ mở: {redemptionInfo.rewardDateTime}</span>
      </div>

      {isReady ? (
        hasReward ? (
          <>
            <p className="message message--success">
              {eggName} đã nở. Đây là phần thưởng của bạn.
            </p>
            <AccountRewardCard reward={redemptionInfo.reward} />
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
