import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

const DIAMOND_TIERS = new Set(["A", "B", "C"]);

function getRewardTier(redemptionInfo) {
  return String(
    redemptionInfo?.reward?.tier ||
      redemptionInfo?.account?.tier ||
      redemptionInfo?.eggTier ||
      ""
  )
    .trim()
    .toUpperCase();
}

export function RewardTierEggBadge({ redemptionInfo }) {
  const isDiamond = DIAMOND_TIERS.has(getRewardTier(redemptionInfo));

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
