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
    redemptionInfo,
    errorMsg,
    daysToWait,
    isChecking,
    isClaiming,
    availableChoices,
    allAvailableChoicesOpened,
    choiceEggs,
    checkCode,
    claimReward,
    claimReadyReward,
    reset,
    backToChoices,
    choices,
  } = useGiftCode(giftCatalogData);

  const handleCheck = async (event) => {
    event?.preventDefault();
    await checkCode(inputValue);
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
  const resultBackLabel = allAvailableChoicesOpened
    ? "Quay lại xem trứng"
    : "Quay lại mở trứng tiếp";

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

        {(status === GIFT_CODE_STATUS.idle ||
          status === GIFT_CODE_STATUS.invalid) && (
          <div ref={codeEntryRef}>
            <GiftCodeEntryPanel
              inputValue={inputValue}
              status={status}
              errorMsg={errorMsg}
              isLoading={isChecking}
              onInputChange={setInputValue}
              onSubmit={handleCheck}
            />
          </div>
        )}

        <section className="incubator-stage incubator-stage--eggs-only">
          <StageIntroCopy daysToWait={daysToWait} />
          <StageEggDisplay
            selectedEgg={selectedStageEgg}
            onSelectEgg={handleStageEggSelect}
          />
          <StageMetrics />
        </section>

        {status === GIFT_CODE_STATUS.choosing && (
          <div ref={actionSectionRef}>
            <RewardChoicePage
              code={currentCode}
              daysToWait={daysToWait}
              isClaiming={isClaiming}
              availableChoices={availableChoices}
              instantEgg={choiceEggs[choices.now]}
              delayedEgg={choiceEggs[choices.later]}
              claimError={errorMsg}
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
              backLabel={resultBackLabel}
              onReset={backToChoices}
            />
          </div>
        )}

        {status === GIFT_CODE_STATUS.claimedLater && (
          <div ref={actionSectionRef}>
            <IncubatingRewardPage
              redemptionInfo={redemptionInfo}
              isClaiming={isClaiming}
              claimError={errorMsg}
              onClaimReady={claimReadyReward}
              backLabel={resultBackLabel}
              onReset={backToChoices}
            />
          </div>
        )}
      </section>

      <StatusRail />
      <SupportContactRail />
    </main>
  );
}
