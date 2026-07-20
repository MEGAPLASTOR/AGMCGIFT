import { useCallback, useState } from "react";
import { EGG_CHOICES } from "../../../api/eggs";
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
  backLabel = "Quay lại xem lựa chọn",
}) {
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const accounts = getRewardAccounts(redemptionInfo);
  const isReady = redemptionInfo.isReady || isCountdownComplete;
  const hasReward = accounts.length > 0;
  const isGoldEgg =
    redemptionInfo?.choice === EGG_CHOICES.instant ||
    Number(redemptionInfo?.eggType) === 1;
  const packageName = isGoldEgg ? "Gói nhận ngay" : "Gói chuẩn bị";
  const cooldownDays = Number(redemptionInfo?.cooldownDays || (isGoldEgg ? 3 : 15));
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownComplete(true);
  }, []);

  return (
    <section className="gift-panel gift-panel--result gift-panel--incubating">
      <div className="incubating-page__hero">
        <div>
          <p className="eyebrow">
            {hasReward
              ? `${packageName} đã sẵn sàng`
              : isGoldEgg
                ? `${packageName} đang chờ xử lý`
                : `${packageName} ${cooldownDays} ngày`}
          </p>
          <h2>
            {hasReward
              ? "Thông tin quà tri ân"
              : isReady
                ? "Nhận thông tin quà"
                : "Vui lòng chờ hệ thống chuẩn bị"}
          </h2>
        </div>
        {hasReward || isGoldEgg ? (
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
        <span>Ngày giờ nhận: {redemptionInfo.rewardDateTime}</span>
        {accounts.length > 1 ? <span>Số tài khoản: {accounts.length}</span> : null}
        {getPositiveNumber(redemptionInfo.totalCount) ? (
          <span>Tổng lượt: {redemptionInfo.totalCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.claimedCount) ? (
          <span>Đã bàn giao: {redemptionInfo.claimedCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.hatchingCount) ? (
          <span>Đang chuẩn bị: {redemptionInfo.hatchingCount}</span>
        ) : null}
        {getPositiveNumber(redemptionInfo.stuckCount) ? (
          <span>Bị kẹt: {redemptionInfo.stuckCount}</span>
        ) : null}
      </div>

      {isReady ? (
        hasReward ? (
          <>
            <p className="message message--success">
              {redemptionInfo.message ||
                `${packageName} đã hoàn tất. Đây là thông tin quà tri ân của bạn.`}
            </p>
            {getPositiveNumber(redemptionInfo.stuckCount) ? (
              <p className="message message--warning">
                Có {redemptionInfo.stuckCount} lượt chưa bàn giao được do thiếu tài khoản trong pool hoặc chưa có pool liên kết.
              </p>
            ) : null}
            <div className="tier-reward-list">
              {accounts.map((account, index) => (
                <AccountRewardCard
                  key={`${account.taiKhoan || account.username || "reward"}-${index}`}
                  account={account}
                  title={
                    accounts.length > 1
                      ? `Nhân vật bàn giao #${index + 1}`
                      : "Nhân vật bàn giao"
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="message message--success">
              {packageName} đã sẵn sàng. Bấm nhận để xem thông tin quà.
            </p>
            <button type="button" onClick={onClaimReady} disabled={isClaiming}>
              {isClaiming ? "Đang xử lý..." : "Nhận quà đã chuẩn bị"}
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
            Hệ thống đang chuẩn bị quà. Đến đúng thời gian ở trên, bạn có thể quay lại để nhận thông tin bàn giao.
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
