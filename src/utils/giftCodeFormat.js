export const GIFT_CODE_EXAMPLE = "260622PSYR4BHX";
export const GIFT_CODE_FORMAT_LABEL =
  "6 chữ số + 8 ký tự chữ/số";
export const GIFT_CODE_PATTERN = /^\d{6}[A-Z0-9]{8}$/;
export const GIFT_CODE_SERVER_PREFIX = "DHSPE_";

export function formatGiftCodeInputValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[-_]+/g, "")
    .replace(/^(?:DHSPE|HDSPE)(?=\d)/, "");
}

export function isValidGiftCodeFormat(value) {
  return GIFT_CODE_PATTERN.test(formatGiftCodeInputValue(value));
}

export function formatGiftCodeForServer(value) {
  const code = formatGiftCodeInputValue(value);

  return code ? `${GIFT_CODE_SERVER_PREFIX}${code}` : "";
}
