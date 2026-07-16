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
const GIFT_CONFIRM_AGREEMENT_SECTIONS = [
  {
    title: "1. Xác nhận tham gia tự nguyện",
    paragraphs: [
      "Tôi xác nhận đã mua thành công sản phẩm mô hình đồ chơi vật lý của AGMC thông qua sàn thương mại điện tử.",
      "Tôi tự nguyện tham gia chương trình tri ân AGMC Gift và đồng ý nhận phần quà trải nghiệm là nhân vật game do AGMC chuẩn bị sẵn theo nội dung chương trình.",
    ],
  },
  {
    title: "2. Cam kết sử dụng đúng mục đích",
    paragraphs: [
      "Tôi cam kết không lợi dụng chương trình để trục lợi thông qua việc hoàn hàng, hoàn tiền hoặc sử dụng các hình thức gian lận khác sau khi đã kích hoạt và nhận quà.",
      "Nếu phát hiện hành vi gian lận, AGMC có quyền từ chối phục vụ, thu hồi quyền sử dụng chương trình và tạm ngừng quyền truy cập AGMC Gift theo quy định.",
    ],
  },
  {
    title: "3. Xác nhận về giá trị quà tặng",
    paragraphs: [
      "Tôi hiểu rằng nhân vật game được bàn giao là quà tặng chăm sóc khách hàng đi kèm chương trình tri ân, không phải sản phẩm được bán, không có giá trị quy đổi thành tiền và không cấu thành giá trị của đơn hàng vật lý.",
      "Do được chuẩn bị theo từng thời điểm, cấp độ hoặc trang bị giữa các nhân vật có thể khác nhau và điều này không được xem là lỗi hoặc căn cứ khiếu nại.",
    ],
  },
  {
    title: "4. Trách nhiệm bảo mật",
    paragraphs: [
      "Sau khi nhận bàn giao, tôi sẽ chủ động đổi mật khẩu, liên kết email hoặc số điện thoại và tự chịu trách nhiệm quản lý tài khoản của mình.",
      "AGMC sẽ xóa dữ liệu hỗ trợ tạm thời sau 10 phút kể từ thời điểm bàn giao.",
    ],
  },
];

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
    ? "Quay lại xem lựa chọn"
    : "Quay lại tiếp tục nhận quà";

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

      <section className="incubator-shell" aria-label="AGMC Gift">
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
                  <span>Bản cam kết trước khi nhận quà</span>
                  <h2 id="gift-confirm-check-title">
                    Bản cam kết và thỏa thuận tham gia chương trình tri ân AGMC Gift
                  </h2>
                </div>
              </div>
              <p className="panel-note">Vui lòng đọc kỹ trước khi xác nhận.</p>
              <div className="gift-confirm-agreement">
                <p>
                  Bằng việc nhấn nút <strong>&quot;Đồng ý&quot;</strong>, tôi xác
                  nhận và đồng ý với các nội dung sau:
                </p>

                {GIFT_CONFIRM_AGREEMENT_SECTIONS.map((section) => (
                  <section key={section.title} className="gift-confirm-agreement__section">
                    <h3>{section.title}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </section>
                ))}

                <p className="gift-confirm-agreement__question">
                  Bạn có đồng ý với các điều khoản của chương trình AGMC Gift để
                  nhận bàn giao phần quà tri ân hay không?
                </p>
              </div>
              <div className="gift-confirm-modal__actions">
                <button type="button" onClick={handleConfirmCheck}>
                  Đồng ý
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
                  <h2>{"T\u00e0i kho\u1ea3n b\u1ecb kh\u00f3a t\u1ea1m th\u1eddi"}</h2>
                </div>
                {currentCode ? <span className="panel-chip">{currentCode}</span> : null}
              </div>

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

              <p className="panel-note">
                {"Vui l\u00f2ng li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3 Facebook ho\u1eb7c Zalo \u0111\u1ec3 \u0111\u01b0\u1ee3c \u00e2n x\u00e1."}
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
