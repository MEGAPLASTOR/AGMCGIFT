export const CUSTOMER_STATUS = {
  NORMAL: "NORMAL",
  WARNING: "WARNING",
  TEMP_BANNED: "TEMP_BANNED",
  BANNED: "BANNED",
};

export const CUSTOMER_STATUS_OPTIONS = [
  { value: CUSTOMER_STATUS.NORMAL, label: "Bình thường" },
  { value: CUSTOMER_STATUS.WARNING, label: "Cảnh báo" },
  { value: CUSTOMER_STATUS.TEMP_BANNED, label: "Tạm khóa" },
  { value: CUSTOMER_STATUS.BANNED, label: "Khóa vĩnh viễn" },
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeCustomerStatus(value, fallback = CUSTOMER_STATUS.NORMAL) {
  const normalizedValue = normalizeText(value).toUpperCase().replace(/\s+/g, "_");

  if (
    normalizedValue === CUSTOMER_STATUS.NORMAL ||
    normalizedValue === "ACTIVE" ||
    normalizedValue === "NEW" ||
    normalizedValue === "TRUSTED_1" ||
    normalizedValue === "TRUSTED_2"
  ) {
    return CUSTOMER_STATUS.NORMAL;
  }

  if (normalizedValue === CUSTOMER_STATUS.WARNING) {
    return CUSTOMER_STATUS.WARNING;
  }

  if (
    normalizedValue === CUSTOMER_STATUS.TEMP_BANNED ||
    normalizedValue === "TEMP-BANNED" ||
    normalizedValue === "TEMPBAN"
  ) {
    return CUSTOMER_STATUS.TEMP_BANNED;
  }

  if (normalizedValue === CUSTOMER_STATUS.BANNED) {
    return CUSTOMER_STATUS.BANNED;
  }

  return fallback;
}

export function getCustomerStatusLabel(status) {
  const normalizedStatus = normalizeCustomerStatus(status);
  const option = CUSTOMER_STATUS_OPTIONS.find(
    (item) => item.value === normalizedStatus
  );

  return option?.label || normalizedStatus;
}

export function isWarningCustomerStatus(status) {
  return normalizeCustomerStatus(status) === CUSTOMER_STATUS.WARNING;
}

export function isTempBannedCustomerStatus(status) {
  return normalizeCustomerStatus(status) === CUSTOMER_STATUS.TEMP_BANNED;
}

export function isPermanentlyBannedCustomerStatus(status) {
  return normalizeCustomerStatus(status) === CUSTOMER_STATUS.BANNED;
}

export function isBlockedCustomerStatus(status) {
  const normalizedStatus = normalizeCustomerStatus(status);

  return (
    normalizedStatus === CUSTOMER_STATUS.TEMP_BANNED ||
    normalizedStatus === CUSTOMER_STATUS.BANNED
  );
}
