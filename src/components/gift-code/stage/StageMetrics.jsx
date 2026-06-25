import { useState } from "react";
import { GIFT_INFO_MODULES } from "../../../constants/giftInfoModules";

export function StageMetrics() {
  const [activeModuleId, setActiveModuleId] = useState(GIFT_INFO_MODULES[0].id);
  const activeModule =
    GIFT_INFO_MODULES.find((module) => module.id === activeModuleId) ||
    GIFT_INFO_MODULES[0];

  return (
    <div className="stage-info-modules" aria-label="Mục thông tin">
      <div className="stage-metrics stage-metrics--nav">
        {GIFT_INFO_MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            className={
              module.id === activeModuleId ? "stage-info-tab is-active" : "stage-info-tab"
            }
            onClick={() => setActiveModuleId(module.id)}
          >
            <strong>{module.title}</strong>
          </button>
        ))}
      </div>

      <article className="stage-info-panel">
        <span>{activeModule.eyebrow}</span>
        <h3>{activeModule.heading}</h3>
        <p>{activeModule.description}</p>
        <ul>
          {activeModule.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
