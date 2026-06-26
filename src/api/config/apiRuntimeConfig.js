export const DEFAULT_DEV_API_BASE_URL = "http://14.225.212.94/";
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

// BACKEND_API_BASE_URL:
// Frontend uu tien VITE_API_BASE_URL khi build.
// Neu can doi nhanh tren browser dev, set localStorage AGMC_API_BASE_URL.
export function getApiBaseUrl() {
  return normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ||
      getRuntimeApiBaseUrl() ||
      (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : "")
  );
}
