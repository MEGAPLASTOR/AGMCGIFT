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

function getFirstFilledValue(values) {
  return (
    values.find(
      (value) => value !== undefined && value !== null && normalizeText(value)
    ) ?? null
  );
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
    normalizedValue === "TEMPBAN" ||
    normalizedValue === "TEMP_BAN" ||
    normalizedValue === "TEMPBANNED"
  ) {
    return CUSTOMER_STATUS.TEMP_BANNED;
  }

  if (
    normalizedValue === CUSTOMER_STATUS.BANNED ||
    normalizedValue === "PERMANENT_BAN" ||
    normalizedValue === "PERMANENT_BANNED" ||
    normalizedValue === "PERM_BAN" ||
    normalizedValue === "PERM_BANNED" ||
    normalizedValue === "BAN_VV" ||
    normalizedValue === "BANVV"
  ) {
    return CUSTOMER_STATUS.BANNED;
  }

  return fallback;
}

export function extractCustomerState(
  payload,
  fallback = CUSTOMER_STATUS.NORMAL
) {
  const root = payload?.data || payload?.result || payload || {};
  const order = root.order || root.orderInfo || {};
  const customer = root.customer || order.customer || {};
  const rawStatus = getFirstFilledValue([
    root.customerStatus,
    root.customer_status,
    root.statusCustomer,
    root.status_customer,
    customer.customerStatus,
    customer.customer_status,
    customer.status,
    order.customerStatus,
    order.customer_status,
    order.statusCustomer,
    order.status_customer,
    order.customer?.status,
  ]);
  const unbanAt =
    getFirstFilledValue([
      root.unbanAt,
      root.unban_at,
      root.unlockAt,
      root.unlock_at,
      root.banExpiresAt,
      root.ban_expires_at,
      customer.unbanAt,
      customer.unban_at,
      customer.unlockAt,
      customer.unlock_at,
      customer.banExpiresAt,
      customer.ban_expires_at,
      order.unbanAt,
      order.unban_at,
      order.unlockAt,
      order.unlock_at,
      order.banExpiresAt,
      order.ban_expires_at,
    ]) || null;

  return {
    status: normalizeCustomerStatus(rawStatus, fallback),
    rawStatus: rawStatus || "",
    unbanAt,
  };
}

export function extractCustomerBanInfo(payload) {
  const { status, unbanAt } = extractCustomerState(payload, "");

  if (status === CUSTOMER_STATUS.TEMP_BANNED) {
    return {
      type: CUSTOMER_STATUS.TEMP_BANNED,
      unbanAt,
    };
  }

  if (status === CUSTOMER_STATUS.BANNED) {
    return {
      type: CUSTOMER_STATUS.BANNED,
      unbanAt: null,
    };
  }

  return null;
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
