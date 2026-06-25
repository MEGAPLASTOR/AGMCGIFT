import anhGaLogo from "../../../assets/images/anh-ga-logo.png";

export function GiftTopbar() {
  return (
    <header className="gift-topbar">
      <div className="brand-lockup" aria-label="Anh Gà MC gift">
        <img className="brand-mark" src={anhGaLogo} alt="Anh Gà MC" />
        <span>
          <strong>AGMC Gift</strong>
          <small>Ổ trứng acc may mắn</small>
        </span>
      </div>
      <div className="topbar-pill">Gift code may mắn</div>
    </header>
  );
}
