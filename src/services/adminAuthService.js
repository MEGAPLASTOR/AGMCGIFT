import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { postJson } from "../api/http/postJson";

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

export function getAdminAuthorizationHeader(session) {
  if (!session?.accessToken) {
    return {};
  }

  return {
    Authorization: `${normalizeTokenType(session.tokenType)} ${session.accessToken}`,
  };
}
