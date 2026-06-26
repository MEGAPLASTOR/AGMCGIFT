const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

export function getRewardInfoFromTargetDate(targetDateValue) {
  const rewardDate = new Date(targetDateValue);
  const diffMs = rewardDate - new Date();

  return {
    rewardReadyAt: rewardDate.toISOString(),
    rewardDate: rewardDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    rewardDateTime: rewardDate.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    daysLeft: Math.max(0, Math.ceil(diffMs / MS_PER_DAY)),
    remainingMs: Math.max(0, diffMs),
    isReady: diffMs <= 0,
  };
}

export function getDelayedRewardInfo(redeemedAt, delayDays) {
  return getRewardInfoFromTargetDate(addDays(redeemedAt, delayDays));
}
