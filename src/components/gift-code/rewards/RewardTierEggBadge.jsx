import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

const TIER_PRIORITY = ["E", "D", "C", "B", "A"];
const PREMIUM_TIERS = new Set(["A", "B", "C"]);

function normalizeTier(value) {
  const tier = String(value || "").trim().toUpperCase();

  return TIER_PRIORITY.includes(tier) ? tier : "";
}

function getRewardTiers(redemptionInfo) {
  const rewards = [
    ...(Array.isArray(redemptionInfo?.accounts) ? redemptionInfo.accounts : []),
    redemptionInfo?.reward,
    redemptionInfo?.account,
  ].filter(Boolean);

  const tiers = rewards.map((reward) => normalizeTier(reward?.tier)).filter(Boolean);

  if (tiers.length) {
    return tiers;
  }

  const fallbackTier = normalizeTier(redemptionInfo?.eggTier);

  return fallbackTier ? [fallbackTier] : [];
}

function getDisplayTier(redemptionInfo) {
  const tiers = getRewardTiers(redemptionInfo);

  return [...TIER_PRIORITY]
    .reverse()
    .find((tier) => tiers.includes(tier)) || "E";
}

export function RewardTierEggBadge({ redemptionInfo }) {
  const displayTier = getDisplayTier(redemptionInfo);
  const eggImage = PREMIUM_TIERS.has(displayTier)
    ? eggPremium15Days
    : eggInstantGold;

  return (
    <span
      className={`reward-tier-egg reward-tier-egg--${displayTier.toLowerCase()}`}
      aria-label={`Trung tier ${displayTier}`}
      role="img"
    >
      <span className="reward-tier-egg__shine" aria-hidden="true" />
      <img src={eggImage} alt="" />
      <span className="reward-tier-egg__label">Tier {displayTier}</span>
    </span>
  );
}
