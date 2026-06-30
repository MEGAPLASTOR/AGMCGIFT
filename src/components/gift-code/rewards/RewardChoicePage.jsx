import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";
import { getEffectiveHatchAt } from "../../../utils/eggFastHatchOverride";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function getWaitLabel(egg, daysToWait) {
  const hatchTime = new Date(
    getEffectiveHatchAt(egg?.eggId, egg?.hatchAt) || ""
  ).getTime();

  if (!Number.isFinite(hatchTime)) {
    return `Ấp ${daysToWait} ngày`;
  }

  const remainingMs = hatchTime - Date.now();

  if (remainingMs <= 0) {
    return "Mở trứng";
  }

  if (remainingMs < HOUR_MS) {
    return `Mở sau ${Math.ceil(remainingMs / MINUTE_MS)} phút`;
  }

  if (remainingMs < 24 * HOUR_MS) {
    return `Mở sau ${Math.ceil(remainingMs / HOUR_MS)} giờ`;
  }

  return `Ấp ${Math.ceil(remainingMs / (24 * HOUR_MS))} ngày`;
}

export function RewardChoicePage({
  code,
  productName,
  daysToWait,
  isClaiming = false,
  availableChoices,
  instantEgg,
  delayedEgg,
  claimError,
  onClaimNow,
  onClaimLater,
  onBack,
}) {
  const canClaimNow = availableChoices?.now ?? true;
  const canClaimLater = availableChoices?.later ?? true;
  const instantNeedsIncubation = Boolean(instantEgg?.requiresIncubation);
  const delayedNeedsIncubation = Boolean(delayedEgg?.requiresIncubation);
  const instantWaitLabel = getWaitLabel(instantEgg, daysToWait);
  const delayedWaitLabel = getWaitLabel(delayedEgg, daysToWait);
  const instantActionLabel = instantNeedsIncubation
    ? instantWaitLabel
    : isClaiming
      ? "Đang mở..."
      : "Nhận ngay";
  const instantDescription = instantNeedsIncubation
    ? "Trứng này cần chờ đủ cooldown trước khi mở."
    : "Nhận acc ngay sau khi random.";

  return (
    <section className="gift-panel reward-choice-page">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Mã đơn hợp lệ</p>
          <h2>Chọn một quả trứng</h2>
        </div>
        <span className="panel-chip">{code}</span>
      </div>

      <p className="panel-note">
        Sản phẩm: <strong>{productName}</strong>. Acc vẫn đang ẩn, chỉ random
        sau khi bạn chọn trứng.
      </p>

      <div className="reward-egg-grid">
        <button
          type="button"
          className="reward-egg-card reward-egg-card--instant"
          disabled={isClaiming || !canClaimNow}
          onClick={onClaimNow}
        >
          <span className="reward-egg-card__image">
            <img src={eggInstantGold} alt="" />
          </span>
          <span className="reward-egg-card__content">
            <span>
              <strong>{instantNeedsIncubation ? "Trứng vàng đang ấp" : "Trứng vàng"}</strong>
              <span>{instantDescription}</span>
            </span>
            <em>{instantActionLabel}</em>
          </span>
        </button>

        <button
          type="button"
          className="reward-egg-card reward-egg-card--premium"
          disabled={isClaiming || !canClaimLater}
          onClick={onClaimLater}
        >
          <span className="reward-egg-card__image">
            <img src={eggPremium15Days} alt="" />
          </span>
          <span className="reward-egg-card__content">
            <span>
              <strong>Trứng kim cương</strong>
              <span>
                {!delayedNeedsIncubation
                  ? "Trứng đã sẵn sàng mở."
                  : "Đợi đến giờ mở phần thưởng xịn hơn."}
              </span>
            </span>
            <em>
              {!delayedNeedsIncubation
                ? "Mở trứng"
                : delayedWaitLabel}
            </em>
          </span>
        </button>
      </div>

      {claimError ? <p className="message message--error">{claimError}</p> : null}

      <button type="button" className="secondary-button" onClick={onBack}>
        Quay lại nhập code
      </button>
    </section>
  );
}
