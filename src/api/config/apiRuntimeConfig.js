export const DEFAULT_DEV_API_BASE_URL = "";
export const RUNTIME_API_BASE_KEY = "AGMC_API_BASE_URL";

export function normalizeApiBaseUrl(value) {
  return String(value || "").replace(/\/$/, "");
}

export function getRuntimeApiBaseUrl() {
  if (typeof window === "undefined") return "";

  try {
    return (
      window.__AGMC_API_BASE_URL__ ||
      window.localStorage?.getItem(RUNTIME_API_BASE_KEY) ||
      ""
    );
  } catch {
    return "";
  }
}

// API_BASE_URL:
// Ưu tiên VITE_API_BASE_URL khi build.
// Nếu cần đổi nhanh trên browser dev, set localStorage AGMC_API_BASE_URL.
export function getApiBaseUrl() {
  return normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV
        ? getRuntimeApiBaseUrl() || DEFAULT_DEV_API_BASE_URL
        : "")
  );
}
