import {
  ADMIN_ENDPOINTS,
  getAdminProductEggMappingEndpoint,
  getAdminProductEggMappingRatesEndpoint,
} from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";
import { normalizePoolTier } from "../utils/poolTier";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError(
      "Vui lòng đăng nhập admin trước khi quản lý mapping sản phẩm.",
      {
        status: 401,
        payload: null,
        endpoint,
      }
    );
  }

  return authHeader;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeMappingType(value) {
  return Number(value) === 2 ? 2 : 1;
}

function getResponseRecord(payload) {
  return payload?.data || payload?.mapping || payload?.productEggMapping || payload;
}

function buildProductEggMappingPayload(record) {
  const productId = Number(record.productId || record.kvProductId || record.kv_product_id);
  const poolId = normalizeText(record.poolId || record.pool_id || record.gift_pool_id);
  const mappingsType = normalizeMappingType(
    record.mappingsType ||
      record.mappings_type ||
      record.eggType ||
      record.egg_type
  );

  if (!Number.isFinite(productId) || productId <= 0) {
    throw new Error("Vui lòng nhập kv_product_id hợp lệ.");
  }

  if (!poolId) {
    throw new Error("Vui lòng nhập gift_pool_id.");
  }

  return { productId, poolId, mappingsType };
}

function normalizeProductEggMapping(record, fallback = {}) {
  const source = record || {};
  const giftPool = source.giftPool || source.gift_pool || {};
  const productId =
    source.productId ||
    source.kvProductId ||
    source.kv_product_id ||
    fallback.kv_product_id ||
    fallback.productId ||
    "";
  const poolId =
    source.poolId ||
    source.pool_id ||
    source.giftPoolId ||
    source.gift_pool_id ||
    giftPool.id ||
    fallback.gift_pool_id ||
    "";
  const mappingsType = normalizeMappingType(
    source.mappingsType ||
      source.mappings_type ||
      source.eggType ||
      source.egg_type ||
      fallback.mappingsType ||
      fallback.mappings_type ||
      fallback.egg_type
  );

  return {
    id: source.id || fallback.id || `${productId}:${poolId}:${mappingsType}`,
    kv_product_id: String(productId),
    kv_variant_id: source.kv_variant_id || fallback.kv_variant_id || "",
    mappings_type: mappingsType,
    mappingsType,
    egg_type: mappingsType,
    gift_pool_id: poolId,
    poolId,
    egg_tier: normalizePoolTier(
      source.eggTier ||
        source.egg_tier ||
        giftPool.tier ||
        fallback.egg_tier
    ),
    rate: Number(source.rate ?? source.ratePercent ?? source.rate_percent ?? fallback.rate ?? 0),
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
    mappingsType: requestBody.mappingsType,
    mappings_type: requestBody.mappingsType,
    egg_type: requestBody.mappingsType,
  });
}

function buildProductEggMappingRatesPayload(mappings) {
  const payload = (Array.isArray(mappings) ? mappings : [])
    .map((mapping) => ({
      mappingId: normalizeText(mapping.mappingId || mapping.id),
      rate: Number(mapping.rate),
    }))
    .filter((mapping) => mapping.mappingId);

  if (!payload.length) {
    throw new Error("Vui lòng chọn mapping cần cập nhật tỉ lệ.");
  }

  payload.forEach((mapping) => {
    if (!Number.isFinite(mapping.rate) || mapping.rate < 0) {
      throw new Error("Tỉ lệ mapping phải là số không âm.");
    }
  });

  return payload;
}

export async function updateAdminProductEggMappingRates(productId, mappings, authHeader) {
  const normalizedProductId = Number(productId);

  if (!Number.isFinite(normalizedProductId) || normalizedProductId <= 0) {
    throw new Error("Vui lòng chọn sản phẩm hợp lệ để cập nhật tỉ lệ.");
  }

  const endpoint = getAdminProductEggMappingRatesEndpoint(normalizedProductId);
  const requestBody = buildProductEggMappingRatesPayload(mappings);

  await requestJson(endpoint, {
    method: "PUT",
    body: requestBody,
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return requestBody;
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
