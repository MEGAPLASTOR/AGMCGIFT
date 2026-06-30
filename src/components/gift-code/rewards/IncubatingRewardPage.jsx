import { useCallback, useEffect, useState } from "react";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";
import { getEffectiveHatchAt } from "../../../utils/eggFastHatchOverride";
import { getRewardInfoFromTargetDate } from "../../../utils/rewardDate";
import { AccountRewardCard } from "./AccountRewardCard";
import { CountdownTimer } from "./CountdownTimer";

export function IncubatingRewardPage({
  redemptionInfo,
  isClaiming = false,
  claimError,
  onClaimReady,
  onReset,
}) {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [, setRefreshTick] = useState(0);
  const rewardReadyAt = getEffectiveHatchAt(
    redemptionInfo.eggId,
    redemptionInfo.rewardReadyAt
  );
  const effectiveRedemptionInfo = rewardReadyAt
    ? {
        ...redemptionInfo,
        ...getRewardInfoFromTargetDate(rewardReadyAt),
      }
    : redemptionInfo;
  const isReady = effectiveRedemptionInfo.isReady || isCountdownComplete;
  const hasReward = Boolean(
    effectiveRedemptionInfo.reward || effectiveRedemptionInfo.account
  );
  const eggName =
    effectiveRedemptionInfo.eggSlot === 1 ? "Trứng vàng" : "Trứng kim cương";
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshTick((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="gift-panel gift-panel--result gift-panel--incubating">
      <div className="incubating-page__hero">
        <div>
          <p className="eyebrow">{eggName} đang ấp</p>
          <h2>Đợi đủ ngày để nhận acc</h2>
        </div>
        <img src={eggPremium15Days} alt="" />
      </div>

      <div className="result-summary">
        <span>Code: {effectiveRedemptionInfo.code}</span>
        <span>Sản phẩm: {effectiveRedemptionInfo.productName}</span>
        <span>Ngày giờ mở: {effectiveRedemptionInfo.rewardDateTime}</span>
      </div>

      {isReady ? (
        hasReward ? (
          <>
            <p className="message message--success">
              {eggName} đã nở. Đây là phần thưởng của bạn.
            </p>
            <AccountRewardCard reward={effectiveRedemptionInfo.reward} />
          </>
        ) : (
          <>
            <p className="message message--success">
              {eggName} đã sẵn sàng. Bấm mở để nhận acc.
            </p>
            <button type="button" onClick={onClaimReady} disabled={isClaiming}>
              {isClaiming ? "Đang mở trứng..." : `Mở ${eggName.toLowerCase()}`}
            </button>
          </>
        )
      ) : (
        <>
          <CountdownTimer
            targetDate={effectiveRedemptionInfo.rewardReadyAt}
            onComplete={handleCountdownComplete}
          />
          <p className="message message--warning">
            Acc xịn đã được giữ lại. Khi đếm ngược về 0, trứng sẽ sẵn sàng mở.
          </p>
        </>
      )}

      {claimError ? <p className="message message--error">{claimError}</p> : null}

      <button type="button" onClick={onReset}>
        Nhập code khác
      </button>
    </section>
  );
}
