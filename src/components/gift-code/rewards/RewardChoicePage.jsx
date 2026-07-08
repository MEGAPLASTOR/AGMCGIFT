import eggInstantGold from "../../../assets/images/egg-instant-gold.png";

function isReadyToOpen(egg) {
  if (!egg?.hatchAt) return true;

  return new Date(egg.hatchAt).getTime() <= Date.now();
}

export function RewardChoicePage({
  code,
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
  const delayedReady = isReadyToOpen(delayedEgg);
  const instantNeedsIncubation = Boolean(instantEgg?.requiresIncubation);
  const instantActionLabel = instantOpened
    ? "Xem acc"
    : instantNeedsIncubation
      ? "Đang chờ mở"
      : isClaiming
        ? "Đang mở..."
        : "Mở trứng";
  const instantDescription = instantOpened
    ? "Nhóm trứng này đã mở, bấm để xem lại acc."
    : !canClaimNow
      ? "Không có trứng thường cho mã này."
      : instantNeedsIncubation
        ? "Bạn đang bị Warning do vi phạm"
        : "Bấm mở để nhận acc theo số trứng backend mở được.";
  const delayedDescription = delayedOpened
    ? "Nhóm trứng này đã mở, bấm để xem lại acc."
    : !canClaimLater
      ? "Không có trứng ấp 15 ngày cho mã này."
      : delayedReady
        ? "Hết cooldown, bấm mở để nhận acc theo số trứng backend mở được."
        : "Đang ấp, chưa lộ trứng vàng hay kim cương.";
  const delayedActionLabel = delayedOpened
    ? "Xem acc"
    : delayedReady
      ? isClaiming
        ? "Đang mở..."
        : "Mở trứng"
      : `Ấp ${daysToWait} ngày`;

  return (
    <section className="gift-panel reward-choice-page">
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--success">Mã đơn hợp lệ</p>
          <h2>Chọn trứng muốn mở</h2>
        </div>
        <span className="panel-chip">{code}</span>
      </div>

      <div className="reward-egg-grid">
        <button
          type="button"
          className="reward-egg-card reward-egg-card--instant"
          disabled={isClaiming || !canClaimNow}
          onClick={onClaimNow}
        >
          {instantEgg?.eggCount > 0 && (
            <span className="reward-egg-count-badge">
              X{instantEgg.eggCount}
            </span>
          )}
          <span className="reward-egg-card__image">
            <img src={eggInstantGold} alt="" />
          </span>
          <span className="reward-egg-card__content">
            <span>
              <strong>
                {instantNeedsIncubation ? "Trứng vàng đang cooldown" : "Trứng thường"}
              </strong>
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
          {delayedEgg?.eggCount > 0 && (
            <span className="reward-egg-count-badge">
              X{delayedEgg.eggCount}
            </span>
          )}
          <span className="reward-egg-card__image">
            <span className="mystery-egg" aria-hidden="true">
              ?
            </span>
          </span>
          <span className="reward-egg-card__content">
            <span>
              <strong>
                {delayedOpened ? "Trứng đã mở" : "Trứng bí ẩn 15 ngày"}
              </strong>
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
