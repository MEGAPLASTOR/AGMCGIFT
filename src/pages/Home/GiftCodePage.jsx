import { useEffect, useRef, useState } from "react";
import { AdminModalPortal } from "../../components/admin/AdminModalPortal";
import { GiftCodeEntryPanel } from "../../components/gift-code/forms/GiftCodeEntryPanel";
import { GiftPageDecorations } from "../../components/gift-code/layout/GiftPageDecorations";
import { GiftTopbar } from "../../components/gift-code/layout/GiftTopbar";
import { StatusRail } from "../../components/gift-code/layout/StatusRail";
import { SupportContactRail } from "../../components/gift-code/layout/SupportContactRail";
import { CountdownTimer } from "../../components/gift-code/rewards/CountdownTimer";
import { IncubatingRewardPage } from "../../components/gift-code/rewards/IncubatingRewardPage";
import { InstantRewardPage } from "../../components/gift-code/rewards/InstantRewardPage";
import { RewardChoicePage } from "../../components/gift-code/rewards/RewardChoicePage";
import { StageEggDisplay } from "../../components/gift-code/stage/StageEggDisplay";
import { StageIntroCopy } from "../../components/gift-code/stage/StageIntroCopy";
import { StageMetrics } from "../../components/gift-code/stage/StageMetrics";
import { giftCatalogData } from "../../config/giftCatalogData";
import { GIFT_CODE_STATUS } from "../../constants/giftCodeStatus";
import { SUPPORT_LINKS } from "../../constants/supportLinks";
import { scrollToSection } from "../../helpers/scrollToSection";
import { useGiftCode } from "../../hooks/useGiftCode";

const SCROLL_TOP_GAP = 120;

export default function GiftCodePage() {
  const [inputValue, setInputValue] = useState("");
  const [selectedStageEgg, setSelectedStageEgg] = useState(null);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const codeEntryRef = useRef(null);
  const actionSectionRef = useRef(null);

  const {
    status,
    currentCode,
    redemptionInfo,
    banInfo,
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

    if (!inputValue.trim()) {
      await checkCode(inputValue);
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmCheck = async () => {
    setConfirmModalOpen(false);
    await checkCode(inputValue);
  };

  const handleReset = () => {
    setInputValue("");
    setSelectedStageEgg(null);
    setConfirmModalOpen(false);
    reset();
  };

  const handleBackToCodeEntry = () => {
    setSelectedStageEgg(null);
    setConfirmModalOpen(false);
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
      status === GIFT_CODE_STATUS.claimedLater ||
      status === GIFT_CODE_STATUS.tempBanned ||
      status === GIFT_CODE_STATUS.banned
    ) {
      scrollToSection(actionSectionRef.current, SCROLL_TOP_GAP);
    }
  }, [status]);

  return (
    <main className="gift-page">
      <GiftPageDecorations />

      <section className="incubator-shell" aria-label="AGMC Gift Hatchery">
        <GiftTopbar />

        {isConfirmModalOpen ? (
          <AdminModalPortal onClick={() => setConfirmModalOpen(false)}>
            <section
              className="gift-panel gift-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gift-confirm-check-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="gift-confirm-modal__head">
                <div>
                  <span>Xác nhận trước khi kiểm tra</span>
                  <h2 id="gift-confirm-check-title">Xác nhận không báo công an</h2>
                </div>
              </div>
              <p className="panel-note">
                Sau khi xác nhận, hệ thống mới kiểm tra mã đơn và cho bạn tiếp tục
                nhận trứng.
              </p>
              <div className="gift-confirm-modal__actions">
                <button type="button" onClick={handleConfirmCheck}>
                  Xác nhận
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmModalOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </section>
          </AdminModalPortal>
        ) : null}

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

        {status === GIFT_CODE_STATUS.tempBanned && (
          <div ref={actionSectionRef}>
            <section className="gift-panel gift-panel--result gift-panel--ban">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{"T\u1ea1m kh\u00f3a"}</p>
                  <h2>{"T\u00e0i kho\u1ea3n \u0111ang b\u1ecb temp ban"}</h2>
                </div>
                {currentCode ? <span className="panel-chip">{currentCode}</span> : null}
              </div>

              <p className="message message--warning">
                {banInfo?.message ||
                  "B\u1ea1n ch\u01b0a th\u1ec3 m\u1edf qu\u00e0 l\u00fac n\u00e0y. Khi \u0111\u1ebfm ng\u01b0\u1ee3c v\u1ec1 0, h\u00e3y ki\u1ec3m tra l\u1ea1i \u0111\u1ec3 \u0111\u01b0\u1ee3c g\u1ee1 ban."}
              </p>

              {banInfo?.unbanAt ? (
                <CountdownTimer
                  targetDate={banInfo.unbanAt}
                  readyMessage={
                    "\u0110\u00e3 h\u1ebft th\u1eddi gian temp ban. B\u1ea5m ki\u1ec3m tra l\u1ea1i \u0111\u1ec3 ti\u1ebfp t\u1ee5c."
                  }
                  ariaLabel={
                    "Th\u1eddi gian c\u00f2n l\u1ea1i \u0111\u1ebfn l\u00fac m\u1edf ban"
                  }
                />
              ) : (
                <p className="panel-note">
                  {
                    "H\u1ec7 th\u1ed1ng ch\u01b0a tr\u1ea3 v\u1ec1 th\u1eddi \u0111i\u1ec3m m\u1edf ban. Vui l\u00f2ng th\u1eed l\u1ea1i sau."
                  }
                </p>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={handleBackToCodeEntry}
              >
                {"Ki\u1ec3m tra l\u1ea1i m\u00e3 \u0111\u01a1n"}
              </button>
            </section>
          </div>
        )}

        {status === GIFT_CODE_STATUS.banned && (
          <div ref={actionSectionRef}>
            <section className="gift-panel gift-panel--result gift-panel--ban">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{"Ban v\u0129nh vi\u1ec5n"}</p>
                  <h2>{"T\u00e0i kho\u1ea3n \u0111\u00e3 b\u1ecb ban v\u0129nh vi\u1ec5n"}</h2>
                </div>
                {currentCode ? <span className="panel-chip">{currentCode}</span> : null}
              </div>

              <p className="message message--error">
                {banInfo?.message ||
                  "T\u00e0i kho\u1ea3n n\u00e0y b\u1ecb kh\u00f3a v\u0129nh vi\u1ec5n, kh\u00f4ng th\u1ec3 t\u1ef1 m\u1edf l\u1ea1i tr\u00ean trang client."}
              </p>
              <p className="panel-note">
                {
                  "Ch\u1ec9 c\u00f3 th\u1ec3 nh\u1eafn Facebook ho\u1eb7c Zalo c\u1ee7a ch\u1ee7 shop \u0111\u1ec3 xin \u00e2n x\u00e1."
                }
              </p>

              <div className="ban-contact-links">
                <a
                  className="secondary-button"
                  href={SUPPORT_LINKS.facebook}
                  target="_blank"
                  rel="noreferrer"
                >
                  {"Nh\u1eafn Facebook"}
                </a>
                <a
                  className="secondary-button"
                  href={SUPPORT_LINKS.zalo}
                  target="_blank"
                  rel="noreferrer"
                >
                  {"Nh\u1eafn Zalo"}
                </a>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={handleBackToCodeEntry}
              >
                {"Quay l\u1ea1i nh\u1eadp m\u00e3 kh\u00e1c"}
              </button>
            </section>
          </div>
        )}
      </section>

      <StatusRail />
      <SupportContactRail />
    </main>
  );
}
