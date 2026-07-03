import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

const DIAMOND_TIERS = new Set(["A", "B", "C"]);

function getRewardTiers(redemptionInfo) {
  const rewards = [
    ...(Array.isArray(redemptionInfo?.accounts) ? redemptionInfo.accounts : []),
    redemptionInfo?.reward,
    redemptionInfo?.account,
  ].filter(Boolean);

  return rewards
    .map((reward) => String(reward?.tier || redemptionInfo?.eggTier || "").trim().toUpperCase())
    .filter(Boolean);
}

export function RewardTierEggBadge({ redemptionInfo }) {
  const isDiamond = getRewardTiers(redemptionInfo).some((tier) =>
    DIAMOND_TIERS.has(tier)
  );

  return (
    <span
      className={`reward-tier-egg reward-tier-egg--${
        isDiamond ? "diamond" : "gold"
      }`}
      aria-label={isDiamond ? "Trứng kim cương" : "Trứng vàng"}
      role="img"
    >
      <img src={isDiamond ? eggPremium15Days : eggInstantGold} alt="" />
    </span>
  );
}
