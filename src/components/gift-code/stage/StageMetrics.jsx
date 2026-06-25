import { Link } from "react-router-dom";
import { GIFT_INFO_MODULES } from "../../../constants/giftInfoModules";

export function StageMetrics() {
  return (
    <nav className="stage-info-modules" aria-label="Mục thông tin">
      <div className="stage-metrics stage-metrics--nav">
        {GIFT_INFO_MODULES.map((module) => (
          <Link
            key={module.id}
            className="stage-info-tab"
            to={`/gift-info/${module.id}`}
          >
            <strong>{module.title}</strong>
          </Link>
        ))}
      </div>
    </nav>
  );
}
