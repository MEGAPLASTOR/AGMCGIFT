import { useCallback, useState } from "react";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";
import { AccountRewardCard } from "./AccountRewardCard";
import { CountdownTimer } from "./CountdownTimer";

export function IncubatingRewardPage({ redemptionInfo, onReset }) {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const isReady = redemptionInfo.isReady || isCountdownComplete;
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
  }, []);

  return (
    <section className="gift-panel gift-panel--result gift-panel--incubating">
      <div className="incubating-page__hero">
        <div>
          <p className="eyebrow">Trứng kim cương đang ấp</p>
          <h2>Đợi đủ ngày để nhận acc xịn</h2>
        </div>
        <img src={eggPremium15Days} alt="" />
      </div>

      <div className="result-summary">
        <span>Code: {redemptionInfo.code}</span>
        <span>Sản phẩm: {redemptionInfo.productName}</span>
        <span>Ngày giờ mở: {redemptionInfo.rewardDateTime}</span>
      </div>

      {isReady ? (
        <>
          <p className="message message--success">
            Trứng kim cương đã nở. Mở phần thưởng ngay bên dưới.
          </p>
          <AccountRewardCard reward={redemptionInfo.reward} />
        </>
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

      <button type="button" onClick={onReset}>
        Nhập code khác
      </button>
    </section>
  );
}
