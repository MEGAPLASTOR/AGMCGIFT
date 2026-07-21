import {
  ADMIN_ENDPOINTS,
  getAdminProductEggQuantitiesEndpoint,
} from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi đồng bộ sản phẩm.", {
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

export function updateAdminProductEggQuantities(productId, quantities, authHeader) {
  const normalizedProductId = Number(productId);
  const body = {
    eggType1Qty: Number(quantities.eggType1Qty),
    eggType2Qty: Number(quantities.eggType2Qty),
  };

  if (
    !Number.isFinite(normalizedProductId) ||
    normalizedProductId <= 0 ||
    !Number.isInteger(body.eggType1Qty) ||
    body.eggType1Qty < 0 ||
    !Number.isInteger(body.eggType2Qty) ||
    body.eggType2Qty < 0
  ) {
    throw new Error("Số lượng trứng phải là số nguyên không âm.");
  }

  const endpoint = getAdminProductEggQuantitiesEndpoint(normalizedProductId);

  return requestJson(endpoint, {
    method: "PUT",
    body,
    headers: { Authorization: requireAuthHeader(authHeader, endpoint) },
  });
}
