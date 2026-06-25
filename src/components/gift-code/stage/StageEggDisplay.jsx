import eggInstantGold from "../../../assets/images/egg-instant-gold.png";
import eggPremium15Days from "../../../assets/images/egg-premium-15-days.png";

export function StageEggDisplay({ selectedEgg, onSelectEgg }) {
  return (
    <div className="stage-hanging-eggs">
      <div className="stage-hanging-eggs__pair">
        <button
          type="button"
          className={`stage-hanging-egg stage-hanging-egg--gold ${
            selectedEgg === "gold" ? "stage-hanging-egg--selected" : ""
          }`}
          onClick={() => onSelectEgg("gold")}
          aria-label="Chọn trứng vàng"
        >
          <img src={eggInstantGold} alt="" />
        </button>
        <button
          type="button"
          className={`stage-hanging-egg stage-hanging-egg--diamond ${
            selectedEgg === "diamond" ? "stage-hanging-egg--selected" : ""
          }`}
          onClick={() => onSelectEgg("diamond")}
          aria-label="Chọn trứng kim cương"
        >
          <img src={eggPremium15Days} alt="" />
        </button>
      </div>
    </div>
  );
}
