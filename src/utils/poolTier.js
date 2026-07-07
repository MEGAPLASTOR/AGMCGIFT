export const POOL_TIERS = ["S", "A", "B", "C", "D", "E"];
export const DEFAULT_POOL_TIER = "A";
export const POOL_TIER_OPTIONS = POOL_TIERS.map((tier) => ({
  value: tier,
  label: tier,
}));

function normalizeText(value) {
  return String(value ?? "").trim().toUpperCase();
}

export function normalizePoolTier(value, fallback = "") {
  const tier = normalizeText(value);

  return POOL_TIERS.includes(tier) ? tier : fallback;
}

export function formatPoolTierList(joiner = ", ") {
  return POOL_TIERS.join(joiner);
}
