import { EGG_CHOICES } from "../constants/eggChoices";
import { normalizeApiText } from "../utils/normalizeApiText";

function getRawEggSlot(rawEgg) {
  return Number(
    rawEgg.eggSlot ??
      rawEgg.egg_slot ??
      rawEgg.eggIndex ??
      rawEgg.egg_index ??
      rawEgg.slot ??
      rawEgg.position ??
      rawEgg.sequence ??
      rawEgg.order
  );
}

function getEggSlot(rawEgg, index) {
  const slot = getRawEggSlot(rawEgg);

  return Number.isFinite(slot) && slot > 0 ? slot : index + 1;
}

function hasExplicitSlot(rawEgg) {
  const slot = getRawEggSlot(rawEgg);

  return Number.isFinite(slot) && slot > 0;
}

function getExplicitChoice(rawEgg) {
  const choiceText = normalizeApiText(
    rawEgg.choice ||
      rawEgg.eggChoice ||
      rawEgg.egg_choice ||
      rawEgg.selection ||
      rawEgg.typeLabel ||
      rawEgg.type_label
  );

  if (
    choiceText.includes("nhan_ngay") ||
    choiceText.includes("instant") ||
    choiceText.includes("now") ||
    choiceText.includes("fast") ||
    choiceText.includes("nhanh") ||
    choiceText.includes("so 1") ||
    choiceText.includes("slot 1")
  ) {
    return EGG_CHOICES.instant;
  }

  if (
    choiceText.includes("cho_nhan") ||
    choiceText.includes("delayed") ||
    choiceText.includes("later") ||
    choiceText.includes("premium") ||
    choiceText.includes("diamond") ||
    choiceText.includes("kim cuong") ||
    choiceText.includes("thach thuc") ||
    choiceText.includes("so 2") ||
    choiceText.includes("slot 2")
  ) {
    return EGG_CHOICES.delayed;
  }

  return "";
}

function hasCooldown(egg) {
  const statusText = normalizeApiText(egg.displayStatus);

  return (
    Boolean(egg.hatchAt) ||
    statusText.includes("incubat") ||
    statusText.includes("hatch") ||
    statusText.includes("waiting") ||
    statusText.includes("locked") ||
    statusText.includes("cooldown") ||
    statusText.includes("ap") ||
    statusText.includes("cho")
  );
}

function getChoice(rawEgg, egg, index, totalEggs) {
  const explicitChoice = getExplicitChoice(rawEgg);

  if (explicitChoice) {
    return explicitChoice;
  }

  if (hasExplicitSlot(rawEgg)) {
    if (egg.slot === 1) {
      return EGG_CHOICES.instant;
    }

    if (egg.slot === 2) {
      return EGG_CHOICES.delayed;
    }
  }

  if (Number(egg.eggType) === 1) {
    return EGG_CHOICES.instant;
  }

  if (Number(egg.eggType) === 2) {
    return EGG_CHOICES.delayed;
  }

  if (totalEggs > 1) {
    return index === 0 ? EGG_CHOICES.instant : EGG_CHOICES.delayed;
  }

  return index === 0 ? EGG_CHOICES.instant : EGG_CHOICES.delayed;
}

export function normalizeEgg(rawEgg, index = 0, totalEggs = 0) {
  const egg = {
    eggId: rawEgg.eggId || rawEgg.id || rawEgg.egg_id,
    eggType: Number(rawEgg.eggType ?? rawEgg.egg_type ?? 0),
    eggTier: rawEgg.eggTier || rawEgg.egg_tier || rawEgg.tier || rawEgg.giftPool?.tier || "",
    displayStatus: rawEgg.displayStatus || rawEgg.status || "Sẵn sàng",
    hatchAt: rawEgg.hatchAt || rawEgg.hatch_at || null,
    createdAt: rawEgg.createdAt || rawEgg.created_at || null,
    slot: getEggSlot(rawEgg, index),
  };
  const requiresIncubation = hasCooldown(egg);

  return {
    ...egg,
    requiresIncubation,
    choice: getChoice(rawEgg, egg, index, totalEggs),
  };
}
