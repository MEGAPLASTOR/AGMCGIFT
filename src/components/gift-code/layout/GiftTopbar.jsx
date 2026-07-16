import { Link } from "react-router-dom";
import anhGaLogo from "../../../assets/images/anh-ga-logo.png";
import { giftCodeRoute } from "../../../routes/giftCodeRoute";

export function GiftTopbar() {
  return (
    <header className="gift-topbar">
      <Link
        className="brand-lockup"
        to={giftCodeRoute.path}
        aria-label="Về trang chủ AGMC Gift"
      >
        <img className="brand-mark" src={anhGaLogo} alt="Anh Gà MC" />
        <span>
          <strong>AGMC Gift</strong>
          <small>Hệ thống tri ân khách hàng</small>
        </span>
      </Link>
    </header>
  );
}
