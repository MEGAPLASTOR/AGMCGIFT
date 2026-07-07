import { EGG_CHOICES } from "../../../api/eggs";
import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

const TIER_PRIORITY = ["E", "D", "C", "B", "A", "S"];

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

function isDiamondEgg(redemptionInfo) {
  if (redemptionInfo?.choice) {
    return redemptionInfo.choice === EGG_CHOICES.delayed;
  }

  if (redemptionInfo?.rewardReadyAt || redemptionInfo?.rewardDateTime) {
    return true;
  }

  return Number(redemptionInfo?.eggType) === 2;
}

export function RewardTierEggBadge({ redemptionInfo }) {
  const displayTier = getDisplayTier(redemptionInfo);
  const diamondEgg = isDiamondEgg(redemptionInfo);

  return (
    <span
      className={`reward-tier-egg reward-tier-egg--${displayTier.toLowerCase()}`}
      aria-label={`Trung ${diamondEgg ? "kim cuong" : "vang"} tier ${displayTier}`}
      role="img"
    >
      <span className="reward-tier-egg__shine" aria-hidden="true" />
      <img src={diamondEgg ? eggPremium15Days : eggInstantGold} alt="" />
      <span className="reward-tier-egg__label">Tier {displayTier}</span>
    </span>
  );
}
