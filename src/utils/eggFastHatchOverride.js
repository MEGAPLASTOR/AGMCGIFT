const STORAGE_KEY = "agmc_fast_hatch_overrides";
const MAX_OVERRIDE_AGE_MS = 24 * 60 * 60 * 1000;

function readOverrides() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeOverrides(overrides) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function isValidDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function removeExpiredOverrides(overrides) {
  const now = Date.now();

  return Object.fromEntries(
    Object.entries(overrides).filter(([, item]) => {
      const approvedAt = new Date(item?.approvedAt || item?.hatchAt).getTime();

      return Number.isFinite(approvedAt) && now - approvedAt < MAX_OVERRIDE_AGE_MS;
    })
  );
}

export function saveFastHatchOverride(eggId, hatchAt) {
  if (!eggId || !isValidDate(hatchAt)) {
    return;
  }

  const overrides = removeExpiredOverrides(readOverrides());

  overrides[eggId] = {
    hatchAt,
    approvedAt: new Date().toISOString(),
  };

  writeOverrides(overrides);
}

export function getFastHatchOverride(eggId) {
  if (!eggId) {
    return "";
  }

  const overrides = removeExpiredOverrides(readOverrides());
  const nextOverrides = readOverrides();

  if (Object.keys(overrides).length !== Object.keys(nextOverrides).length) {
    writeOverrides(overrides);
  }

  const hatchAt = overrides[eggId]?.hatchAt;

  return isValidDate(hatchAt) ? hatchAt : "";
}

export function getEffectiveHatchAt(eggId, hatchAt) {
  const overrideHatchAt = getFastHatchOverride(eggId);

  if (!overrideHatchAt) {
    return hatchAt || null;
  }

  if (!hatchAt) {
    return overrideHatchAt;
  }

  return new Date(overrideHatchAt).getTime() < new Date(hatchAt).getTime()
    ? overrideHatchAt
    : hatchAt;
}
