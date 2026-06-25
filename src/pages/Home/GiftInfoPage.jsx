import { Link, Navigate, useParams } from "react-router-dom";
import { GiftPageDecorations } from "../../components/gift-code/layout/GiftPageDecorations";
import { GiftTopbar } from "../../components/gift-code/layout/GiftTopbar";
import { SupportContactRail } from "../../components/gift-code/layout/SupportContactRail";
import {
  DEFAULT_GIFT_INFO_MODULE_ID,
  GIFT_INFO_MODULES,
  getGiftInfoModule,
} from "../../constants/giftInfoModules";
import { giftCodeRoute } from "../../routes/giftCodeRoute";

export default function GiftInfoPage() {
  const { moduleId } = useParams();
  const activeModule = getGiftInfoModule(moduleId);

  if (!activeModule) {
    return <Navigate to={`/gift-info/${DEFAULT_GIFT_INFO_MODULE_ID}`} replace />;
  }

  return (
    <main className="gift-page gift-info-page">
      <GiftPageDecorations />

      <section className="incubator-shell gift-info-shell" aria-label={activeModule.title}>
        <GiftTopbar />

        <section className="gift-info-hero">
          <div>
            <p className="gift-info-eyebrow">{activeModule.eyebrow}</p>
            <h1>{activeModule.title}</h1>
            <h2>{activeModule.heading}</h2>
            <p>{activeModule.description}</p>
          </div>

          <nav className="gift-info-nav" aria-label="Chọn mục thông tin">
            {GIFT_INFO_MODULES.map((module) => (
              <Link
                key={module.id}
                className={
                  module.id === activeModule.id
                    ? "gift-info-nav__item is-active"
                    : "gift-info-nav__item"
                }
                to={`/gift-info/${module.id}`}
              >
                {module.title}
              </Link>
            ))}
          </nav>
        </section>

        <section className="gift-info-content">
          <div className="gift-info-card">
            <span>Nội dung chính</span>
            <ul>
              {activeModule.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="gift-info-card gift-info-card--accent">
            <span>Lưu ý</span>
            <p>
              Mã đơn hàng cần được nhập đúng như thông tin mua hàng. Với trứng ấp,
              khách nên quay lại đúng thời điểm hiển thị trên bộ đếm ngược để mở
              phần thưởng.
            </p>
          </div>
        </section>

        <div className="gift-info-actions">
          <Link to={giftCodeRoute.path}>Quay lại mở trứng</Link>
        </div>
      </section>

      <SupportContactRail />
    </main>
  );
}
