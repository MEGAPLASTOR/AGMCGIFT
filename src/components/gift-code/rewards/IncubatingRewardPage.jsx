import { useCallback, useState } from "react";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";
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
  const isReady = redemptionInfo.isReady || isCountdownComplete;
  const hasReward = Boolean(redemptionInfo.reward || redemptionInfo.account);
  const eggName =
    redemptionInfo.eggSlot === 1 ? "Trứng vàng" : "Trứng kim cương";
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
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
            targetDate={redemptionInfo.rewardReadyAt}
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
