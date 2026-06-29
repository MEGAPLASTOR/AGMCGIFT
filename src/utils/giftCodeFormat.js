export const GIFT_CODE_EXAMPLE = "HDSPE_260622PSYR4BHX";
export const GIFT_CODE_FORMAT_LABEL =
  "HDSPE_ + 6 chữ số + 8 ký tự chữ/số";
export const GIFT_CODE_PATTERN = /^DHSPE_\d{6}[A-Z0-9]{20}$/;

export function formatGiftCodeInputValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_");
}

export function isValidGiftCodeFormat(value) {
  return GIFT_CODE_PATTERN.test(formatGiftCodeInputValue(value));
}
