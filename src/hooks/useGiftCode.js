import { useCallback, useMemo, useState } from "react";
import {
  claimEggById,
  EGG_CHOICES,
  getEggClaimErrorMessage,
  getEggSyncErrorMessage,
  normalizeClaimEggResponse,
  normalizeSyncEggResponse,
  syncEggsByOrderCode,
} from "../api/eggs";
import { GIFT_CODE_STATUS } from "../constants/giftCodeStatus";
import {
  getDelayedRewardInfo,
  getRewardInfoFromTargetDate,
} from "../utils/rewardDate";

const LUA_CHON_NHAN_NGAY = EGG_CHOICES.instant;
const LUA_CHON_CHO_NHAN_THUONG_XIN = EGG_CHOICES.delayed;

function getEggReadyInfo(egg, fallbackDays) {
  if (egg.hatchAt) {
    return getRewardInfoFromTargetDate(egg.hatchAt);
  }

  return getDelayedRewardInfo(new Date().toISOString(), fallbackDays);
}

function isEggReady(egg) {
  if (!egg.hatchAt) return true;

  return new Date(egg.hatchAt).getTime() <= Date.now();
}

function createBaseRedemption(selectedEntry, egg) {
  const now = new Date().toISOString();

  return {
    code: selectedEntry.code.code,
    orderId: selectedEntry.order.id,
    orderCode: selectedEntry.order.maDonHang,
    customerName: selectedEntry.order.tenKhachHang,
    customerStatus: selectedEntry.order.customerStatus,
    deliveryStatus: selectedEntry.order.deliveryStatus,
    productId: selectedEntry.product.id,
    productName: selectedEntry.product.tenSanPham,
    eggId: egg.eggId,
    eggType: egg.eggType,
    eggStatus: egg.displayStatus,
    redeemedAt: now,
  };
}

export function useGiftCode(catalogData) {
  const [status, setStatus] = useState(GIFT_CODE_STATUS.idle);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [redemptionInfo, setRedemptionInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const soNgayCho =
    (catalogData.config || catalogData.cauHinh)?.soNgayChoNhanThuongXin || 15;

  const availableChoices = useMemo(
    () => ({
      now: Boolean(selectedEntry?.eggsByChoice?.[LUA_CHON_NHAN_NGAY]),
      later: Boolean(
        selectedEntry?.eggsByChoice?.[LUA_CHON_CHO_NHAN_THUONG_XIN]
      ),
    }),
    [selectedEntry]
  );
  const choiceEggs = selectedEntry?.eggsByChoice || {};

  const checkCode = useCallback(async (inputCode) => {
    const trimmedCode = inputCode.trim().toUpperCase();

    if (!trimmedCode) {
      setErrorMsg("Vui lòng nhập mã đơn hàng.");
      setStatus(GIFT_CODE_STATUS.invalid);
      return;
    }
    // console.log(inputCode, trimmedCode);

    setIsChecking(true);
    setErrorMsg("");
    setSelectedEntry(null);
    setRedemptionInfo(null);

    try {
      // BACKEND_API_NHAP_MA_DON:
      // Frontend POST code lên /api/eggs/sync.
      // Backend kiểm tra đơn KiotViet/SAPO, trạng thái khách, trạng thái giao hàng
      // rồi trả về danh sách trứng hợp lệ để khách chọn.
      const payload = await syncEggsByOrderCode(trimmedCode);
      const matchedEntry = normalizeSyncEggResponse(payload, trimmedCode);
      
      // console.log(payload);

      if (!matchedEntry.eggs.length) {
        setErrorMsg("Mã đơn hợp lệ nhưng chưa có trứng khả dụng.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      setSelectedEntry(matchedEntry);
      setStatus(GIFT_CODE_STATUS.choosing);
    } catch (error) {
      // console.log(error);
      setErrorMsg(getEggSyncErrorMessage(error));
      setStatus(GIFT_CODE_STATUS.invalid);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const claimReward = useCallback(
    async (choice) => {
      if (status !== GIFT_CODE_STATUS.choosing || !selectedEntry || isClaiming) {
        return;
      }

      const selectedEgg = selectedEntry.eggsByChoice?.[choice];

      if (!selectedEgg) {
        setErrorMsg("Không tìm thấy trứng phù hợp cho lựa chọn này.");
        return;
      }

      const baseRedemption = createBaseRedemption(selectedEntry, selectedEgg);

      if (
        choice === LUA_CHON_CHO_NHAN_THUONG_XIN &&
        (!selectedEgg.hatchAt || !isEggReady(selectedEgg))
      ) {
        setRedemptionInfo({
          ...baseRedemption,
          choice,
          ...getEggReadyInfo(selectedEgg, soNgayCho),
        });
        setErrorMsg("");
        setStatus(GIFT_CODE_STATUS.claimedLater);
        return;
      }

      setIsClaiming(true);
      setErrorMsg("");

      try {
        // BACKEND_API_MO_TRUNG:
        // Frontend chỉ gửi eggId lên /api/eggs/claim.
        // Backend chịu trách nhiệm chống spam, kiểm tra trứng sẵn sàng,
        // random account và khóa account bằng transaction.
        const claimPayload = await claimEggById(selectedEgg.eggId);
        const reward = normalizeClaimEggResponse(claimPayload);
        const newRedemption = {
          ...baseRedemption,
          choice,
          reward,
          account: reward,
          claimedAt: new Date().toISOString(),
          ...(choice === LUA_CHON_CHO_NHAN_THUONG_XIN
            ? getEggReadyInfo(selectedEgg, soNgayCho)
            : {}),
        };

        setRedemptionInfo(newRedemption);
        setStatus(
          choice === LUA_CHON_NHAN_NGAY
            ? GIFT_CODE_STATUS.claimedNow
            : GIFT_CODE_STATUS.claimedLater
        );
      } catch (error) {
        setErrorMsg(getEggClaimErrorMessage(error));
      } finally {
        setIsClaiming(false);
      }
    },
    [isClaiming, selectedEntry, soNgayCho, status]
  );

  const claimReadyReward = useCallback(async () => {
    if (!redemptionInfo?.eggId || isClaiming) return;

    setIsClaiming(true);
    setErrorMsg("");

    try {
      const claimPayload = await claimEggById(redemptionInfo.eggId);
      const reward = normalizeClaimEggResponse(claimPayload);

      setRedemptionInfo((current) => ({
        ...current,
        reward,
        account: reward,
        claimedAt: new Date().toISOString(),
        isReady: true,
      }));
    } catch (error) {
      setErrorMsg(getEggClaimErrorMessage(error));
    } finally {
      setIsClaiming(false);
    }
  }, [isClaiming, redemptionInfo?.eggId]);

  const reset = useCallback(() => {
    setStatus(GIFT_CODE_STATUS.idle);
    setSelectedEntry(null);
    setRedemptionInfo(null);
    setErrorMsg("");
    setIsChecking(false);
    setIsClaiming(false);
  }, []);

  return {
    status,
    selectedEntry,
    currentCode: selectedEntry?.code.code || "",
    redemptionInfo,
    errorMsg,
    daysToWait: soNgayCho,
    choiceEggs,
    isChecking,
    isClaiming,
    availableChoices,
    checkCode,
    claimReward,
    claimReadyReward,
    reset,
    choices: {
      now: LUA_CHON_NHAN_NGAY,
      later: LUA_CHON_CHO_NHAN_THUONG_XIN,
    },
  };
}
