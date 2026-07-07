import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

export const SYSTEM_CONFIG_KEYS = {
  banDay: "BAN_DAY",
  permanentBan: "PERMANENT_BAN",
};

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi cập nhật cấu hình.", {
      status: 401,
      payload: null,
      endpoint,
    });
  }

  return authHeader;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getResponseArray(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.items,
    payload?.records,
    payload?.data?.items,
    payload?.data?.records,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function normalizeDate(value) {
  return value || null;
}

export function normalizeAdminSystemConfig(row) {
  return {
    configKey: normalizeText(row?.configKey || row?.config_key),
    configValue: normalizeText(row?.configValue || row?.config_value),
    description: normalizeText(row?.description),
    updatedAt: normalizeDate(row?.updatedAt || row?.updated_at),
  };
}

export function getAdminSystemConfigMap(rows) {
  return rows.reduce((result, row) => {
    if (row?.configKey) {
      result[row.configKey] = row;
    }

    return result;
  }, {});
}

export async function fetchAdminSystemConfigs(authHeader) {
  const endpoint = ADMIN_ENDPOINTS.systemConfigs;
  const payload = await requestJson(endpoint, {
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return getResponseArray(payload).map(normalizeAdminSystemConfig);
}

export async function updateAdminSystemConfigs(configs, authHeader) {
  const endpoint = ADMIN_ENDPOINTS.systemConfigs;
  const body = Object.fromEntries(
    Object.entries(configs || {}).map(([key, value]) => [key, normalizeText(value)])
  );

  return requestJson(endpoint, {
    method: "POST",
    body,
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });
}
