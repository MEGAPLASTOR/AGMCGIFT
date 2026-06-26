export function normalizeApiText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
