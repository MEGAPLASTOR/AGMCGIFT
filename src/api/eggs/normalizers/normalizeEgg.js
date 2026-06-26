import { EGG_CHOICES } from "../constants/eggChoices";
import { normalizeApiText } from "../utils/normalizeApiText";

function isDelayedEgg(egg) {
  const statusText = normalizeApiText(egg.displayStatus);

  return (
    Boolean(egg.hatchAt) ||
    Number(egg.eggType) === 2 ||
    statusText.includes("incubat") ||
    statusText.includes("hatch") ||
    statusText.includes("waiting") ||
    statusText.includes("locked") ||
    statusText.includes("premium") ||
    statusText.includes("diamond") ||
    statusText.includes("kim") ||
    statusText.includes("15")
  );
}

export function normalizeEgg(rawEgg) {
  const egg = {
    eggId: rawEgg.eggId || rawEgg.id || rawEgg.egg_id,
    eggType: Number(rawEgg.eggType ?? rawEgg.egg_type ?? 0),
    displayStatus: rawEgg.displayStatus || rawEgg.status || "Sẵn sàng",
    hatchAt: rawEgg.hatchAt || rawEgg.hatch_at || null,
  };

  return {
    ...egg,
    choice: isDelayedEgg(egg) ? EGG_CHOICES.delayed : EGG_CHOICES.instant,
  };
}
