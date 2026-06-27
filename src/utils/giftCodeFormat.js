export const GIFT_CODE_EXAMPLE = "2606168FJ15CHF";
export const GIFT_CODE_FORMAT_LABEL =
  "6 chữ số + 8 ký tự chữ/số";
export const GIFT_CODE_PATTERN = /^\d{6}[A-Z0-9]{8}$/;

export function formatGiftCodeInputValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[-_]+/g, "");
}

export function isValidGiftCodeFormat(value) {
  return GIFT_CODE_PATTERN.test(formatGiftCodeInputValue(value));
}
