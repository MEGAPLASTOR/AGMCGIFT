import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

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
    ? "Xem thông tin"
    : instantNeedsIncubation
      ? "Cảnh báo"
      : isClaiming
        ? "Đang xử lý..."
        : "Nhận ngay";
  const instantDescription = instantOpened
    ? "Gói quà này đã được bàn giao, bấm để xem lại thông tin."
    : !canClaimNow
      ? "Không có gói nhận ngay cho mã này."
      : instantNeedsIncubation
        ? "Tài khoản hiện đang bị cảnh báo do vi phạm."
        : "Bấm để nhận thông tin quà theo số lượng hệ thống đủ điều kiện bàn giao.";
  const delayedDescription = delayedOpened
    ? "Gói quà này đã được bàn giao, bấm để xem lại thông tin."
    : !canClaimLater
      ? "Không có gói chuẩn bị cho mã này."
      : delayedReady
        ? "Hệ thống đã chuẩn bị xong, bấm để nhận thông tin quà."
        : "Hệ thống đang chuẩn bị quà và sẽ bàn giao khi đủ thời gian.";
  const delayedActionLabel = delayedOpened
    ? "Xem thông tin"
    : delayedReady
      ? isClaiming
        ? "Đang xử lý..."
        : "Nhận quà"
      : `Chờ ${daysToWait} ngày`;

  return (
    <section className="gift-panel reward-choice-page">
      <div className="panel-heading">
        <div>
          <p className="eyebrow eyebrow--success">Mã đơn hợp lệ</p>
          <h2>Chọn gói quà muốn nhận</h2>
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
              <strong>{instantNeedsIncubation ? "Gói ưu tiên" : "Gói nhận ngay"}</strong>
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
            <img src={eggPremium15Days} alt="" />
          </span>
          <span className="reward-egg-card__content">
            <span>
              <strong>{delayedOpened ? "Gói đã sẵn sàng" : `Đang ấp, xin vui lòng chờ ${daysToWait} ngày để nhận quà`}</strong>
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
