import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { postJson } from "../api/http/postJson";
import { requestJson } from "../api/http/requestJson";

function normalizeTokenType(value) {
  return String(value || "Bearer").trim() || "Bearer";
}

function normalizeLoginPayload(payload, username) {
  const accessToken = payload?.accessToken;

  if (!accessToken) {
    throw new ApiRequestError("API đăng nhập không trả về accessToken.", {
      status: 200,
      payload,
      endpoint: ADMIN_ENDPOINTS.login,
    });
  }

  return {
    accessToken,
    tokenType: normalizeTokenType(payload?.tokenType),
    username: String(payload?.username || username || "").trim(),
    role: String(payload?.role || "ADMIN").trim(),
  };
}

export async function loginAdmin({ username, password }) {
  const payload = await postJson(ADMIN_ENDPOINTS.login, {
    username: String(username || "").trim(),
    password,
  });

  return normalizeLoginPayload(payload, username);
}

export async function updateAdminCredentials(
  { oldPassword, newUsername = "", newPassword = "" },
  authHeader
) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi đổi thông tin đăng nhập.", {
      status: 401,
      payload: null,
      endpoint: ADMIN_ENDPOINTS.authCredentials,
    });
  }

  return requestJson(ADMIN_ENDPOINTS.authCredentials, {
    method: "PUT",
    body: {
      oldPassword,
      newUsername: String(newUsername || "").trim(),
      newPassword,
    },
    headers: {
      Authorization: authHeader,
    },
  });
}

export function getAdminAuthorizationHeader(session) {
  if (!session?.accessToken) {
    return {};
  }

  return {
    Authorization: `${normalizeTokenType(session.tokenType)} ${session.accessToken}`,
  };
}
