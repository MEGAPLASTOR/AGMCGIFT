import { getApiBaseUrl } from "../api/config/apiRuntimeConfig";
import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { getDefaultApiErrorMessage } from "../api/errors/apiErrorMessages";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { postJson } from "../api/http/postJson";
import { readResponsePayload } from "../api/http/readResponsePayload";

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

function buildGiftAccountPayload(record) {
  return {
    username: normalizeText(record.username),
    password: String(record.password || ""),
    tier: normalizeText(record.tier || "normal"),
    token: normalizeText(record.token),
    platform: normalizeText(record.platform || "blox-fruit"),
  };
}

export async function createAdminGiftAccount(record, authHeader) {
  const payload = buildGiftAccountPayload(record);

  if (!payload.username || !payload.password) {
    throw new Error("Vui lòng nhập username và password.");
  }

  return postJson(ADMIN_ENDPOINTS.giftAccountsSingle, payload, {
    headers: {
      Authorization: requireAuthHeader(authHeader),
    },
  });
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
    throw new ApiRequestError("Không kết nối được backend API.", {
      status: 0,
      payload: { message: error.message },
      endpoint,
    });
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    console.error("[AGMC API] Upload gift accounts failed", {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      payload,
    });

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
