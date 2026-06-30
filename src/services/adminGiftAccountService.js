import { getApiBaseUrl } from "../api/config/apiRuntimeConfig";
import {
  ADMIN_ENDPOINTS,
  getAdminGiftAccountEndpoint,
} from "../api/endpoints/adminEndpoints";
import { getDefaultApiErrorMessage } from "../api/errors/apiErrorMessages";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { postJson } from "../api/http/postJson";
import { readResponsePayload } from "../api/http/readResponsePayload";
import { requestJson } from "../api/http/requestJson";
import { normalizeAdminGiftAccount } from "./adminGiftPoolService";

function requireAuthHeader(authHeader) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi thao tác.", {
      status: 401,
      payload: null,
      endpoint: "",
    });
  }

  return authHeader;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeTier(value) {
  const tier = normalizeText(value || "A").toUpperCase();
  return ["A", "B", "C", "D"].includes(tier) ? tier : "";
}

function buildGiftAccountPayload(record) {
  return {
    username: normalizeText(record.username),
    password: String(record.password || ""),
    tier: normalizeTier(record.tier),
    token: normalizeText(record.token),
    platform: normalizeText(record.platform || "blox-fruit"),
  };
}

function buildGiftAccountUpdatePayload(record) {
  return {
    username: normalizeText(record.username),
    password: String(record.password || ""),
    platform: normalizeText(record.platform || "blox-fruit"),
    status: normalizeText(record.status || "AVAILABLE").toUpperCase(),
    token: normalizeText(record.token),
  };
}

function getResponseRecord(payload) {
  return payload?.data || payload?.account || payload?.giftAccount || payload;
}

export async function createAdminGiftAccount(record, authHeader) {
  const payload = buildGiftAccountPayload(record);

  if (!payload.username || !payload.password) {
    throw new Error("Vui lòng nhập username và password.");
  }

  if (!payload.tier) {
    throw new Error("Tier tài khoản chỉ được dùng A, B, C hoặc D.");
  }

  return postJson(ADMIN_ENDPOINTS.giftAccountsSingle, payload, {
    headers: {
      Authorization: requireAuthHeader(authHeader),
    },
  });
}

export async function updateAdminGiftAccount(id, record, authHeader) {
  const endpoint = getAdminGiftAccountEndpoint(id);
  const payload = buildGiftAccountUpdatePayload(record);

  if (!payload.username || !payload.password || !payload.platform || !payload.status) {
    throw new Error("Vui lòng nhập username, password, platform và status.");
  }

  const responsePayload = await requestJson(endpoint, {
    method: "PUT",
    body: payload,
    headers: {
      Authorization: requireAuthHeader(authHeader),
    },
  });

  return normalizeAdminGiftAccount(getResponseRecord(responsePayload));
}

export async function deleteAdminGiftAccounts(accountIds, authHeader) {
  const normalizedIds = (Array.isArray(accountIds) ? accountIds : [accountIds])
    .map(normalizeText)
    .filter(Boolean);

  if (!normalizedIds.length) {
    throw new Error("Vui lòng chọn tài khoản cần xóa.");
  }

  return requestJson(ADMIN_ENDPOINTS.giftAccountsBatchDelete, {
    method: "POST",
    body: { accountIds: normalizedIds },
    headers: {
      Authorization: requireAuthHeader(authHeader),
    },
  });
}

export function deleteAdminGiftAccount(id, authHeader) {
  return deleteAdminGiftAccounts([id], authHeader);
}

export async function uploadAdminGiftAccounts(file, authHeader) {
  if (!file) {
    throw new Error("Vui lòng chọn file Excel.");
  }

  const endpoint = ADMIN_ENDPOINTS.giftAccountsUpload;
  const formData = new FormData();
  formData.append("file", file);

  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: requireAuthHeader(authHeader),
      },
      body: formData,
    });
  } catch (error) {
    throw new ApiRequestError("Không kết nối được dịch vụ dữ liệu.", {
      status: 0,
      payload: { message: error.message },
      endpoint,
    });
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.message || getDefaultApiErrorMessage(response.status, endpoint),
      {
        status: response.status,
        payload,
        endpoint,
      }
    );
  }

  return payload;
}
