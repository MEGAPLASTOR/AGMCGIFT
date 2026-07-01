import eggInstantGold from "../../../assets/images/egg-instant-gold.png";

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
          className={`stage-hanging-egg stage-hanging-egg--mystery ${
            selectedEgg === "mystery" ? "stage-hanging-egg--selected" : ""
          }`}
          onClick={() => onSelectEgg("mystery")}
          aria-label="Trứng bí ẩn 15 ngày"
        >
          <span className="mystery-egg mystery-egg--stage" aria-hidden="true">?</span>
        </button>
      </div>
    </div>
  );
}
