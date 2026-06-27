import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui long dang nhap admin truoc khi dong bo san pham.", {
      status: 401,
      payload: null,
      endpoint,
    });
  }

  return authHeader;
}

export function syncAllAdminProducts(authHeader) {
  return requestJson(ADMIN_ENDPOINTS.productsSyncAll, {
    method: "POST",
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.productsSyncAll),
    },
  });
}
