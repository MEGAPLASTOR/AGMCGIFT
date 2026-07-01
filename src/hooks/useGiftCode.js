import { useCallback, useMemo, useState } from "react";
import {
  claimEggById,
  EGG_CHOICES,
  getDeliveryStatusError,
  getEggClaimErrorMessage,
  getEggSyncErrorMessage,
  normalizeClaimEggResponse,
  normalizeSyncEggResponse,
  syncEggsByOrderCode,
} from "../api/eggs";
import { GIFT_CODE_STATUS } from "../constants/giftCodeStatus";
import {
  addDays,
  getDelayedRewardInfo,
  getRewardInfoFromTargetDate,
} from "../utils/rewardDate";

const LUA_CHON_NHAN_NGAY = EGG_CHOICES.instant;
const LUA_CHON_CHO_NHAN_THUONG_XIN = EGG_CHOICES.delayed;
const CLAIMED_REWARDS_STORAGE_KEY = "agmcGiftClaimedRewards";

function readStoredRedemptions() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function getStoredRedemption(eggId) {
  return readStoredRedemptions()[eggId] || null;
}

function saveStoredRedemption(redemption) {
  if (typeof window === "undefined" || !redemption?.eggId || !redemption?.reward) {
    return;
  }

  const redemptions = readStoredRedemptions();
  redemptions[redemption.eggId] = redemption;
  window.localStorage.setItem(
    CLAIMED_REWARDS_STORAGE_KEY,
    JSON.stringify(redemptions)
  );
}

function getClaimedEgg(entry) {
  return entry?.eggs.find((egg) => egg.isClaimed) || null;
}

function getSavedOrApiReward(egg) {
  const saved = getStoredRedemption(egg.eggId);

  if (saved?.reward) {
    return saved.reward;
  }

  return egg.account ? normalizeClaimEggResponse({ account: egg.account }) : null;
}

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
    eggSlot: egg.slot,
    eggStatus: egg.displayStatus,
    redeemedAt: now,
  };
}

function createClaimedRedemption(selectedEntry, egg, choice, reward, delayDays) {
  return {
    ...createBaseRedemption(selectedEntry, egg),
    choice,
    reward,
    account: reward,
    claimedAt: new Date().toISOString(),
    isReady: true,
    ...(choice === LUA_CHON_CHO_NHAN_THUONG_XIN
      ? getEggReadyInfo(egg, delayDays)
      : {}),
  };
}

function withFallbackHatchAt(entry, delayDays) {
  const eggs = entry.eggs.map((egg) => {
    if (egg.hatchAt || (egg.choice !== LUA_CHON_CHO_NHAN_THUONG_XIN && egg.eggType !== 2)) {
      return egg;
    }

    return {
      ...egg,
      hatchAt: addDays(egg.createdAt || new Date().toISOString(), delayDays).toISOString(),
      requiresIncubation: true,
    };
  });

  return {
    ...entry,
    eggs,
    eggsByChoice: eggs.reduce((map, egg) => {
      if (!map[egg.choice]) {
        map[egg.choice] = egg;
      }

      return map;
    }, {}),
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

  const claimedEgg = useMemo(() => getClaimedEgg(selectedEntry), [selectedEntry]);
  const availableChoices = useMemo(() => {
    const instantEgg = selectedEntry?.eggsByChoice?.[LUA_CHON_NHAN_NGAY];
    const delayedEgg = selectedEntry?.eggsByChoice?.[LUA_CHON_CHO_NHAN_THUONG_XIN];

    return {
      now: Boolean(instantEgg && (!claimedEgg || instantEgg.eggId === claimedEgg.eggId)),
      later: Boolean(delayedEgg && (!claimedEgg || delayedEgg.eggId === claimedEgg.eggId)),
    };
  }, [claimedEgg, selectedEntry]);
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
      // Kiểm tra mã đơn qua /api/eggs/sync và nhận danh sách trứng hợp lệ.
      const payload = await syncEggsByOrderCode(trimmedCode);
      const matchedEntry = withFallbackHatchAt(
        normalizeSyncEggResponse(payload, trimmedCode),
        soNgayCho
      );
      
      // console.log(payload);

      const deliveryStatusError = getDeliveryStatusError(
        matchedEntry.order.deliveryStatus
      );

      if (deliveryStatusError) {
        setErrorMsg(deliveryStatusError);
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

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
  }, [soNgayCho]);

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
      const alreadyClaimedEgg = getClaimedEgg(selectedEntry);

      if (alreadyClaimedEgg) {
        if (alreadyClaimedEgg.eggId !== selectedEgg.eggId) {
          setErrorMsg("Mã đơn này đã mở một trứng rồi. Chỉ bấm lại trứng đã mở để xem acc.");
          return;
        }

        const reward = getSavedOrApiReward(selectedEgg);

        if (!reward) {
          setErrorMsg("Trứng này đã mở rồi nhưng API chưa trả lại acc để xem lại. Vui lòng liên hệ hỗ trợ.");
          return;
        }

        setRedemptionInfo(
          createClaimedRedemption(selectedEntry, selectedEgg, choice, reward, soNgayCho)
        );
        setErrorMsg("");
        setStatus(
          choice === LUA_CHON_NHAN_NGAY
            ? GIFT_CODE_STATUS.claimedNow
            : GIFT_CODE_STATUS.claimedLater
        );
        return;
      }

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
        // Mở trứng qua /api/eggs/claim bằng eggId đã chọn.
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

        saveStoredRedemption(newRedemption);
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

      setRedemptionInfo((current) => {
        const nextRedemption = {
          ...current,
          reward,
          account: reward,
          claimedAt: new Date().toISOString(),
          isReady: true,
        };

        saveStoredRedemption(nextRedemption);
        return nextRedemption;
      });
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
