import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

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
  const instantOpened = Boolean(instantEgg?.isClaimed);
  const delayedOpened = Boolean(delayedEgg?.isClaimed);
  const instantNeedsIncubation = Boolean(instantEgg?.requiresIncubation);
  const instantActionLabel = instantOpened
    ? "Xem acc"
    : instantNeedsIncubation
      ? `Ấp ${daysToWait} ngày`
      : isClaiming
        ? "Đang mở..."
        : "Nhận ngay";
  const instantDescription = instantOpened
    ? "Trứng này đã mở, bấm để xem lại acc."
    : !canClaimNow
      ? "Không có trứng vàng cho mã này."
      : instantNeedsIncubation
        ? "Trứng này cần chờ đủ cooldown trước khi mở."
        : "Nhận acc ngay sau khi random.";
  const delayedDescription = delayedOpened
    ? "Trứng này đã mở, bấm để xem lại acc."
    : !canClaimLater
      ? "Không có trứng kim cương cho mã này."
      : delayedEgg?.requiresIncubation === false
        ? "Trứng đã sẵn sàng mở."
        : "Ấp đủ ngày để mở phần thưởng xịn hơn.";
  const delayedActionLabel = delayedOpened
    ? "Xem acc"
    : delayedEgg?.requiresIncubation === false
      ? isClaiming
        ? "Đang mở..."
        : "Mở trứng"
      : `Ấp ${daysToWait} ngày`;

  return (
    <section className="gift-panel reward-choice-page">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Mã đơn hợp lệ</p>
          <h2>Chọn trứng muốn mở</h2>
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
              <span>{delayedDescription}</span>
            </span>
            <em>{delayedActionLabel}</em>
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
