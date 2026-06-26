import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

export function RewardChoicePage({
  code,
  productName,
  daysToWait,
  isClaiming = false,
  availableChoices,
  claimError,
  onClaimNow,
  onClaimLater,
  onBack,
}) {
  const canClaimNow = availableChoices?.now ?? true;
  const canClaimLater = availableChoices?.later ?? true;

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
              <strong>Trứng vàng</strong>
              <span>Nhận acc ngay sau khi random.</span>
            </span>
            <em>{isClaiming ? "Đang mở..." : "Nhận ngay"}</em>
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
              <span>Ấp đủ ngày để mở phần thưởng xịn hơn.</span>
            </span>
            <em>Ấp {daysToWait} ngày</em>
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
