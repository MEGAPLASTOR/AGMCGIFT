import { FaFacebookF } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { SUPPORT_LINKS } from "../../../constants/supportLinks";

export function SupportContactRail() {
  return (
    <aside className="support-contact-rail" aria-label="Liên hệ hỗ trợ">
      <span>Liên hệ hỗ trợ</span>
      <a
        className="support-contact-rail__item support-contact-rail__item--facebook"
        href={SUPPORT_LINKS.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Liên hệ qua Facebook"
      >
        <FaFacebookF aria-hidden="true" />
      </a>
      <a
        className="support-contact-rail__item support-contact-rail__item--zalo"
        href={SUPPORT_LINKS.zalo}
        target="_blank"
        rel="noreferrer"
        aria-label="Liên hệ qua Zalo"
      >
        <SiZalo aria-hidden="true" />
      </a>
    </aside>
  );
}
