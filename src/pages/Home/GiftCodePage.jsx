import { useEffect, useRef, useState } from "react";
import { GiftCodeEntryPanel } from "../../components/gift-code/forms/GiftCodeEntryPanel";
import { GiftPageDecorations } from "../../components/gift-code/layout/GiftPageDecorations";
import { GiftTopbar } from "../../components/gift-code/layout/GiftTopbar";
import { StatusRail } from "../../components/gift-code/layout/StatusRail";
import { SupportContactRail } from "../../components/gift-code/layout/SupportContactRail";
import { IncubatingRewardPage } from "../../components/gift-code/rewards/IncubatingRewardPage";
import { InstantRewardPage } from "../../components/gift-code/rewards/InstantRewardPage";
import { RewardChoicePage } from "../../components/gift-code/rewards/RewardChoicePage";
import { StageEggDisplay } from "../../components/gift-code/stage/StageEggDisplay";
import { StageIntroCopy } from "../../components/gift-code/stage/StageIntroCopy";
import { StageMetrics } from "../../components/gift-code/stage/StageMetrics";
import { giftCatalogData } from "../../config/giftCatalogData";
import { GIFT_CODE_STATUS } from "../../constants/giftCodeStatus";
import { scrollToSection } from "../../helpers/scrollToSection";
import { useGiftCode } from "../../hooks/useGiftCode";

const SCROLL_TOP_GAP = 120;

export default function GiftCodePage() {
  const [inputValue, setInputValue] = useState("");
  const [selectedStageEgg, setSelectedStageEgg] = useState(null);
  const codeEntryRef = useRef(null);
  const actionSectionRef = useRef(null);

  const {
    status,
    currentCode,
    selectedEntry,
    redemptionInfo,
    errorMsg,
    daysToWait,
    checkCode,
    claimReward,
    reset,
    choices,
  } = useGiftCode(giftCatalogData);

  const handleCheck = (event) => {
    event?.preventDefault();
    checkCode(inputValue);
  };

  const handleReset = () => {
    setInputValue("");
    setSelectedStageEgg(null);
    reset();
  };

  const handleStageEggSelect = (egg) => {
    setSelectedStageEgg(egg);
    scrollToSection(codeEntryRef.current, SCROLL_TOP_GAP);
  };

  useEffect(() => {
    if (
      status === GIFT_CODE_STATUS.choosing ||
      status === GIFT_CODE_STATUS.claimedNow ||
      status === GIFT_CODE_STATUS.claimedLater
    ) {
      scrollToSection(actionSectionRef.current, SCROLL_TOP_GAP);
    }
  }, [status]);

  return (
    <main className="gift-page">
      <GiftPageDecorations />

      <section className="incubator-shell" aria-label="AGMC Gift Hatchery">
        <GiftTopbar />

        <section className="incubator-stage incubator-stage--eggs-only">
          <StageIntroCopy daysToWait={daysToWait} />
          <StageEggDisplay
            selectedEgg={selectedStageEgg}
            onSelectEgg={handleStageEggSelect}
          />
          <StageMetrics />
        </section>

        {(status === GIFT_CODE_STATUS.idle ||
          status === GIFT_CODE_STATUS.invalid) && (
          <div ref={codeEntryRef}>
            <GiftCodeEntryPanel
              inputValue={inputValue}
              status={status}
              errorMsg={errorMsg}
              onInputChange={setInputValue}
              onSubmit={handleCheck}
            />
          </div>
        )}

        {status === GIFT_CODE_STATUS.choosing && (
          <div ref={actionSectionRef}>
            <RewardChoicePage
              code={currentCode}
              productName={selectedEntry.product.tenSanPham}
              daysToWait={daysToWait}
              onClaimNow={() => claimReward(choices.now)}
              onClaimLater={() => claimReward(choices.later)}
              onBack={handleReset}
            />
          </div>
        )}

        {status === GIFT_CODE_STATUS.claimedNow && (
          <div ref={actionSectionRef}>
            <InstantRewardPage
              redemptionInfo={redemptionInfo}
              onReset={handleReset}
            />
          </div>
        )}

        {status === GIFT_CODE_STATUS.claimedLater && (
          <div ref={actionSectionRef}>
            <IncubatingRewardPage
              redemptionInfo={redemptionInfo}
              onReset={handleReset}
            />
          </div>
        )}
      </section>

      <StatusRail daysToWait={daysToWait} />
      <SupportContactRail />
    </main>
  );
}
