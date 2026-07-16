import { Link, Navigate, useParams } from "react-router-dom";
import guideOrderCodeExample from "../../assets/images/guide-order-code-example.png";
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

        <section
          className={
            activeModule.id === "guide"
              ? "gift-info-content gift-info-content--guide"
              : activeModule.cards.length > 1
                ? "gift-info-content"
                : "gift-info-content gift-info-content--single"
          }
        >
          {activeModule.cards.map((card) => (
            <div
              key={card.label}
              className={
                card.accent ? "gift-info-card gift-info-card--accent" : "gift-info-card"
              }
            >
              <span>{card.label}</span>

              {activeModule.id === "guide" && card.label === "Các bước kích hoạt" ? (
                <figure className="gift-info-card__media">
                  <img
                    src={guideOrderCodeExample}
                    alt="Ví dụ vị trí mã đơn hàng trong ứng dụng mua sắm"
                  />
                </figure>
              ) : null}

              {card.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {card.items?.length ? (
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {card.sections?.map((section, index) => (
                <section
                  key={`${card.label}-${section.heading ?? index}`}
                  className="gift-info-card__section"
                >
                  {section.heading ? <h3>{section.heading}</h3> : null}

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.items?.length ? (
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ))}
        </section>

        <div className="gift-info-actions">
          <Link to={giftCodeRoute.path}>Quay lại mở trứng</Link>
        </div>
      </section>

      <SupportContactRail />
    </main>
  );
}
