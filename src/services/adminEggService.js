import { getAdminEggHatchTimeEndpoint } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi sửa giờ ấp.", {
      status: 401,
      payload: null,
      endpoint,
    });
  }

  return authHeader;
}

function getResponseRecord(payload) {
  return payload?.data || payload?.egg || payload;
}

export async function updateAdminEggHatchTime(id, hatchAt, authHeader) {
  const endpoint = getAdminEggHatchTimeEndpoint(id);
  const payload = await requestJson(endpoint, {
    method: "PUT",
    body: { hatchAt },
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return getResponseRecord(payload);
}
