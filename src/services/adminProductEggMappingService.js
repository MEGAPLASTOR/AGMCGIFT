import {
  ADMIN_ENDPOINTS,
  getAdminProductEggMappingEndpoint,
} from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi quản lý mapping sản phẩm.", {
      status: 401,
      payload: null,
      endpoint,
    });
  }

  return authHeader;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getResponseRecord(payload) {
  return payload?.data || payload?.mapping || payload?.productEggMapping || payload;
}

function buildProductEggMappingPayload(record) {
  const productId = Number(record.productId || record.kvProductId || record.kv_product_id);
  const poolId = normalizeText(record.poolId || record.pool_id || record.gift_pool_id);
  const eggType = Number(record.eggType || record.egg_type);

  if (!Number.isFinite(productId) || productId <= 0) {
    throw new Error("Vui lòng nhập kv_product_id hợp lệ.");
  }

  if (!poolId) {
    throw new Error("Vui lòng nhập gift_pool_id.");
  }

  if (![1, 2].includes(eggType)) {
    throw new Error("egg_type chỉ được là 1 hoặc 2.");
  }

  return { productId, poolId, eggType };
}

function normalizeProductEggMapping(record, fallback = {}) {
  const source = record || {};
  const giftPool = source.giftPool || source.gift_pool || {};

  return {
    id:
      source.id ||
      fallback.id ||
      `${source.productId || fallback.productId || fallback.kv_product_id || ""}:${source.eggType || fallback.egg_type || ""}`,
    kv_product_id: String(
      source.productId ||
        source.kvProductId ||
        source.kv_product_id ||
        fallback.kv_product_id ||
        ""
    ),
    kv_variant_id: source.kv_variant_id || fallback.kv_variant_id || "",
    egg_type: Number(source.eggType || source.egg_type || fallback.egg_type || 0),
    gift_pool_id:
      source.poolId ||
      source.pool_id ||
      source.gift_pool_id ||
      giftPool.id ||
      fallback.gift_pool_id ||
      "",
    egg_tier: source.eggTier || source.egg_tier || giftPool.tier || fallback.egg_tier || "",
    created_at: source.createdAt || source.created_at || fallback.created_at || null,
    updated_at: source.updatedAt || source.updated_at || fallback.updated_at || null,
  };
}

export async function linkAdminProductEggMapping(record, authHeader) {
  const requestBody = buildProductEggMappingPayload(record);
  const payload = await requestJson(ADMIN_ENDPOINTS.productEggMappings, {
    method: "POST",
    body: requestBody,
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.productEggMappings),
    },
  });

  return normalizeProductEggMapping(getResponseRecord(payload), {
    ...record,
    kv_product_id: String(requestBody.productId),
    gift_pool_id: requestBody.poolId,
    egg_type: requestBody.eggType,
  });
}

export function deleteAdminProductEggMapping(id, authHeader) {
  const endpoint = getAdminProductEggMappingEndpoint(id);

  return requestJson(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });
}

export function deleteAdminProductEggMappings(mappingIds, authHeader) {
  const normalizedIds = (Array.isArray(mappingIds) ? mappingIds : [mappingIds])
    .map(normalizeText)
    .filter(Boolean);

  if (!normalizedIds.length) {
    throw new Error("Vui lòng chọn mapping cần xóa.");
  }

  return requestJson(ADMIN_ENDPOINTS.productEggMappingsBatchDelete, {
    method: "POST",
    body: { mappingIds: normalizedIds },
    headers: {
      Authorization: requireAuthHeader(
        authHeader,
        ADMIN_ENDPOINTS.productEggMappingsBatchDelete
      ),
    },
  });
}
