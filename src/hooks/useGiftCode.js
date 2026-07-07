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

function hasRewardPayload(value) {
  return Boolean(
    value?.reward ||
      value?.account ||
      (Array.isArray(value?.accounts) && value.accounts.length)
  );
}

function readStoredRedemptions() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CLAIMED_REWARDS_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function getRedemptionStorageKey(orderId, eggType) {
  return `${String(orderId || "").trim()}:${Number(eggType || 0)}`;
}

function getLegacyStoredRedemption(eggIds = []) {
  const redemptions = readStoredRedemptions();

  return eggIds
    .map((eggId) => redemptions[String(eggId || "").trim()])
    .find(
      (redemption) => redemption?.reward || Array.isArray(redemption?.accounts)
    ) || null;
}

function getStoredRedemption(orderId, eggType, eggIds = []) {
  const redemptions = readStoredRedemptions();
  const storageKey = getRedemptionStorageKey(orderId, eggType);

  return redemptions[storageKey] || getLegacyStoredRedemption(eggIds);
}

function saveStoredRedemption(redemption) {
  if (
    typeof window === "undefined" ||
    !redemption?.orderId ||
    !Number.isFinite(Number(redemption?.eggType)) ||
    !hasRewardPayload(redemption)
  ) {
    return;
  }

  const redemptions = readStoredRedemptions();
  redemptions[getRedemptionStorageKey(redemption.orderId, redemption.eggType)] =
    redemption;
  window.localStorage.setItem(
    CLAIMED_REWARDS_STORAGE_KEY,
    JSON.stringify(redemptions)
  );
}

function getValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getEggReadyInfo(egg, fallbackDays) {
  if (egg.hatchAt) {
    return getRewardInfoFromTargetDate(egg.hatchAt);
  }

  return getDelayedRewardInfo(new Date().toISOString(), fallbackDays);
}

function isEggReady(egg) {
  if (!egg?.hatchAt) return true;

  return new Date(egg.hatchAt).getTime() <= Date.now();
}

function getGroupHatchAt(eggs) {
  const hatchDates = eggs
    .map((egg) => getValidDate(egg.hatchAt))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());

  return hatchDates[0]?.toISOString() || null;
}

function getGroupCreatedAt(eggs) {
  const createdDates = eggs
    .map((egg) => getValidDate(egg.createdAt))
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime());

  return createdDates[0]?.toISOString() || null;
}

function buildEggsByChoice(entry, eggs) {
  const groups = eggs.reduce((map, egg) => {
    if (!egg.choice) {
      return map;
    }

    if (!map[egg.choice]) {
      map[egg.choice] = {
        choice: egg.choice,
        eggType: egg.eggType,
        eggTier: egg.eggTier,
        eggIds: [],
        eggs: [],
        productCodes: [],
        displayStatus: egg.displayStatus,
      };
    }

    map[egg.choice].eggIds.push(egg.eggId);
    map[egg.choice].eggs.push(egg);

    if (egg.productCode) {
      map[egg.choice].productCodes.push(egg.productCode);
    }

    return map;
  }, {});

  return Object.fromEntries(
    Object.entries(groups).map(([choice, group]) => {
      const savedRedemption = entry?.order?.id
        ? getStoredRedemption(entry.order.id, group.eggType, group.eggIds)
        : null;
      const savedHasReward = hasRewardPayload(savedRedemption);
      const savedAccounts = Array.isArray(savedRedemption?.accounts)
        ? savedRedemption.accounts
        : savedRedemption?.reward
          ? [savedRedemption.reward]
          : [];
      const apiAccounts = normalizeClaimEggResponse({
        accounts: group.eggs.map((egg) => egg.account).filter(Boolean),
      }).accounts;
      const openedFromApi =
        group.eggs.every((egg) => egg.isClaimed) && apiAccounts.length > 0;
      const accounts = savedAccounts.length
        ? savedAccounts
        : openedFromApi
          ? apiAccounts
          : [];

      return [
        choice,
        {
          ...group,
          eggCount: group.eggs.length,
          eggIds: [...new Set(group.eggIds.filter(Boolean))],
          productCodes: [...new Set(group.productCodes.filter(Boolean))],
          hatchAt: getGroupHatchAt(group.eggs),
          createdAt: getGroupCreatedAt(group.eggs),
          requiresIncubation:
            Number(group.eggType) === 2 ||
            group.eggs.some((egg) => egg.requiresIncubation),
          isClaimed: savedHasReward || openedFromApi,
          reward:
            savedRedemption?.reward ||
            savedRedemption?.account ||
            accounts[0] ||
            null,
          account:
            savedRedemption?.account ||
            savedRedemption?.reward ||
            accounts[0] ||
            null,
          accounts,
          message: savedRedemption?.message || "",
          stuckCount: Number(savedRedemption?.stuckCount ?? 0),
        },
      ];
    })
  );
}

function withEggGroups(entry, eggs = entry?.eggs || []) {
  if (!entry) {
    return entry;
  }

  const nextEntry = {
    ...entry,
    eggs,
  };

  return {
    ...nextEntry,
    eggsByChoice: buildEggsByChoice(nextEntry, eggs),
  };
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
    productCodes: selectedEntry.product.productCodes || egg.productCodes || [],
    eggId: egg.eggIds?.[0] || "",
    eggIds: egg.eggIds || [],
    eggType: egg.eggType,
    eggTier: egg.eggTier,
    eggSlot: egg.slot,
    eggCount: egg.eggCount,
    eggStatus: egg.displayStatus,
    redeemedAt: now,
  };
}

function createClaimedRedemption(selectedEntry, egg, choice, reward, delayDays) {
  const primaryReward =
    reward?.reward || reward?.account || reward?.accounts?.[0] || null;
  const accounts = Array.isArray(reward?.accounts)
    ? reward.accounts
    : primaryReward
      ? [primaryReward]
      : [];

  return {
    ...createBaseRedemption(selectedEntry, egg),
    choice,
    reward: primaryReward,
    account: primaryReward,
    accounts,
    message: reward?.message || primaryReward?.ghiChu || "",
    stuckCount: Number(reward?.stuckCount ?? 0),
    claimedAt: new Date().toISOString(),
    isReady: true,
    ...(choice === LUA_CHON_CHO_NHAN_THUONG_XIN
      ? getEggReadyInfo(egg, delayDays)
      : {}),
  };
}

function markEggClaimed(entry, eggType) {
  if (!entry) return entry;

  const eggs = entry.eggs.map((egg) =>
    Number(egg.eggType) === Number(eggType)
      ? { ...egg, isClaimed: true, displayStatus: "CLAIMED" }
      : egg
  );

  return withEggGroups(entry, eggs);
}

function withFallbackHatchAt(entry, delayDays) {
  const eggs = entry.eggs.map((egg) => {
    if (egg.hatchAt || Number(egg.eggType) !== 2) {
      return egg;
    }

    return {
      ...egg,
      hatchAt: addDays(
        egg.createdAt || new Date().toISOString(),
        delayDays
      ).toISOString(),
      requiresIncubation: true,
    };
  });

  return withEggGroups(entry, eggs);
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
  const choiceEggs = useMemo(
    () => selectedEntry?.eggsByChoice || {},
    [selectedEntry]
  );

  const checkCode = useCallback(
    async (inputCode) => {
      const trimmedCode = inputCode.trim().toUpperCase();

      if (!trimmedCode) {
        setErrorMsg("Vui lòng nhập mã đơn hàng.");
        setStatus(GIFT_CODE_STATUS.invalid);
        return;
      }

      setIsChecking(true);
      setErrorMsg("");
      setSelectedEntry(null);
      setRedemptionInfo(null);

      try {
        const payload = await syncEggsByOrderCode(trimmedCode);
        const matchedEntry = withFallbackHatchAt(
          normalizeSyncEggResponse(payload, trimmedCode),
          soNgayCho
        );
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
        setErrorMsg(getEggSyncErrorMessage(error));
        setStatus(GIFT_CODE_STATUS.invalid);
      } finally {
        setIsChecking(false);
      }
    },
    [soNgayCho]
  );

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
      const savedRedemption = getStoredRedemption(
        selectedEntry.order.id,
        selectedEgg.eggType,
        selectedEgg.eggIds
      );
      const existingRedemption =
        hasRewardPayload(savedRedemption)
          ? savedRedemption
          : selectedEgg.isClaimed && hasRewardPayload(selectedEgg)
            ? createClaimedRedemption(
                selectedEntry,
                selectedEgg,
                choice,
                selectedEgg,
                soNgayCho
              )
            : null;

      if (existingRedemption) {
        setRedemptionInfo(existingRedemption);
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
        const claimPayload = await claimEggById(
          selectedEntry.order.id,
          selectedEgg.eggType
        );
        const reward = normalizeClaimEggResponse(claimPayload);
        const newRedemption = createClaimedRedemption(
          selectedEntry,
          selectedEgg,
          choice,
          reward,
          soNgayCho
        );

        saveStoredRedemption(newRedemption);
        setSelectedEntry((currentEntry) =>
          markEggClaimed(currentEntry, selectedEgg.eggType)
        );
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
    if (!redemptionInfo?.orderId || !redemptionInfo?.eggType || isClaiming) {
      return;
    }

    setIsClaiming(true);
    setErrorMsg("");

    try {
      const claimPayload = await claimEggById(
        redemptionInfo.orderId,
        redemptionInfo.eggType
      );
      const reward = normalizeClaimEggResponse(claimPayload);

      setRedemptionInfo((current) => {
        const nextRedemption = {
          ...current,
          reward: reward.reward || reward.account || reward.accounts?.[0] || null,
          account:
            reward.account || reward.reward || reward.accounts?.[0] || null,
          accounts: reward.accounts || [],
          message: reward.message || "",
          stuckCount: Number(reward.stuckCount ?? 0),
          claimedAt: new Date().toISOString(),
          isReady: true,
        };

        saveStoredRedemption(nextRedemption);
        return nextRedemption;
      });
      setSelectedEntry((currentEntry) =>
        markEggClaimed(currentEntry, redemptionInfo.eggType)
      );
    } catch (error) {
      setErrorMsg(getEggClaimErrorMessage(error));
    } finally {
      setIsClaiming(false);
    }
  }, [isClaiming, redemptionInfo?.eggType, redemptionInfo?.orderId]);

  const reset = useCallback(() => {
    setStatus(GIFT_CODE_STATUS.idle);
    setSelectedEntry(null);
    setRedemptionInfo(null);
    setErrorMsg("");
    setIsChecking(false);
    setIsClaiming(false);
  }, []);

  const backToChoices = useCallback(() => {
    if (!selectedEntry) return;

    setStatus(GIFT_CODE_STATUS.choosing);
    setRedemptionInfo(null);
    setErrorMsg("");
  }, [selectedEntry]);

  const openedChoices = useMemo(
    () => ({
      now: Boolean(
        choiceEggs[LUA_CHON_NHAN_NGAY]?.isClaimed ||
          (redemptionInfo?.choice === LUA_CHON_NHAN_NGAY &&
            (redemptionInfo?.reward || redemptionInfo?.accounts?.length))
      ),
      later: Boolean(
        choiceEggs[LUA_CHON_CHO_NHAN_THUONG_XIN]?.isClaimed ||
          (redemptionInfo?.choice === LUA_CHON_CHO_NHAN_THUONG_XIN &&
            (redemptionInfo?.reward || redemptionInfo?.accounts?.length))
      ),
    }),
    [choiceEggs, redemptionInfo]
  );

  const allAvailableChoicesOpened =
    (!availableChoices.now || openedChoices.now) &&
    (!availableChoices.later || openedChoices.later);

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
    openedChoices,
    allAvailableChoicesOpened,
    checkCode,
    claimReward,
    claimReadyReward,
    reset,
    backToChoices,
    choices: {
      now: LUA_CHON_NHAN_NGAY,
      later: LUA_CHON_CHO_NHAN_THUONG_XIN,
    },
  };
}
