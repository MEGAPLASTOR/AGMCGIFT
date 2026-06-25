import { FaTiktok } from "react-icons/fa6";
import { SiShopee } from "react-icons/si";
import anhGaLogo from "../../../assets/images/anh-ga-logo.png";
import { SHOP_LINKS } from "../../../constants/shopLinks";

export function StatusRail() {
  return (
    <aside className="status-rail shop-rail" aria-label="Kênh mua hàng">
      <span className="shop-rail__label">Mua hàng</span>
      <a
        className="status-rail__item shop-rail__item shop-rail__item--tiktok"
        href={SHOP_LINKS.tiktokShop}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở TikTok Shop Anh Gà"
      >
        <FaTiktok aria-hidden="true" />
        <span>TikTok</span>
      </a>
      <a
        className="status-rail__item shop-rail__item shop-rail__item--shopee"
        href={SHOP_LINKS.shopee}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở Shopee Anh Gà MC Shop"
      >
        <SiShopee aria-hidden="true" />
        <span>Shopee</span>
      </a>
      <a
        className="status-rail__item shop-rail__item shop-rail__item--website"
        href={SHOP_LINKS.website}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở shop Anh Gà MC"
      >
        <img src={anhGaLogo} alt="" aria-hidden="true" />
        <span>Shop</span>
      </a>
    </aside>
  );
}
