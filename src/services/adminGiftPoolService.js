import {
  ADMIN_ENDPOINTS,
  getAdminGiftPoolEndpoint,
} from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi quản lý bể quà.", {
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

function normalizeDate(value) {
  return value || null;
}

function normalizeTier(value) {
  const tier = normalizeText(value || "A").toUpperCase();
  return ["A", "B", "C", "D"].includes(tier) ? tier : "";
}

function normalizeAccountStatus(value) {
  return normalizeText(value || "available").toLowerCase();
}

function getResponseRecord(payload) {
  return payload?.data || payload?.giftPool || payload?.pool || payload;
}

function getResponseArray(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.giftPools,
    payload?.pools,
    payload?.items,
    payload?.records,
    payload?.data?.giftPools,
    payload?.data?.pools,
    payload?.data?.items,
    payload?.data?.records,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function splitIds(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,;]+/)
    .map(normalizeText)
    .filter(Boolean);
}

export function normalizeAdminGiftAccount(account) {
  return {
    id: account.id,
    username: account.username || "",
    password: account.password || "",
    status: normalizeAccountStatus(account.status),
    tier: account.tier || "",
    platform: account.platform || "",
    token: account.token || "",
    created_at: normalizeDate(account.createdAt || account.created_at),
    assigned_at: normalizeDate(account.assignedAt || account.assigned_at),
  };
}

export function normalizeAdminGiftPool(pool, fallback = {}) {
  const source = pool || {};
  const fallbackAccounts =
    fallback.accounts || fallback.giftAccounts || fallback.assignedAccounts || [];
  const accounts =
    source.accounts || source.giftAccounts || source.assignedAccounts || fallbackAccounts;

  return {
    id: source.id || fallback.id,
    pool_name:
      source.poolName ||
      source.pool_name ||
      fallback.poolName ||
      fallback.pool_name ||
      "",
    tier: source.tier || fallback.tier || "",
    created_at: normalizeDate(source.createdAt || source.created_at || fallback.created_at),
    accounts: Array.isArray(accounts) ? accounts.map(normalizeAdminGiftAccount) : [],
  };
}

export function createPoolAccountMapping(poolId, accountId) {
  return {
    id: `${poolId}:${accountId}`,
    pool_id: poolId,
    account_id: accountId,
  };
}

export function getPoolAccountMappingsFromPools(pools) {
  return pools.flatMap((pool) => {
    const normalizedPool = normalizeAdminGiftPool(pool);

    return normalizedPool.accounts.map((account) =>
      createPoolAccountMapping(normalizedPool.id, account.id)
    );
  });
}

function buildGiftPoolPayload(record) {
  const poolName = normalizeText(record.poolName || record.pool_name);
  const tier = normalizeTier(record.tier);

  if (!poolName) {
    throw new Error("Vui lòng nhập tên bể quà.");
  }

  if (!tier) {
    throw new Error("Tier bể quà chỉ được dùng A, B, C hoặc D.");
  }

  return { poolName, tier };
}

function buildPoolAccountPayload(record) {
  const poolId = normalizeText(record.poolId || record.pool_id);
  const accountId = normalizeText(record.accountId || record.account_id);

  if (!poolId || !accountId) {
    throw new Error("Vui lòng nhập pool_id và account_id.");
  }

  return { poolId, accountId };
}

function buildPoolAccountsPayload(record) {
  const poolId = normalizeText(record.poolId || record.pool_id);
  const accountIds = splitIds(
    record.accountIds || record.account_ids || record.accountId || record.account_id
  );

  if (!poolId || !accountIds.length) {
    throw new Error("Vui lòng nhập pool_id và danh sách account_id.");
  }

  return { poolId, accountIds };
}

export async function fetchAdminGiftPools(authHeader) {
  const payload = await requestJson(ADMIN_ENDPOINTS.giftPools, {
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.giftPools),
    },
  });

  return getResponseArray(payload).map((pool) => normalizeAdminGiftPool(pool));
}

export async function getAdminGiftPoolDetail(id, authHeader) {
  const endpoint = getAdminGiftPoolEndpoint(id);
  const payload = await requestJson(endpoint, {
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return normalizeAdminGiftPool(getResponseRecord(payload));
}

export async function fetchAdminGiftPoolDetails(pools, authHeader) {
  const normalizedPools = pools.map((pool) => normalizeAdminGiftPool(pool));
  const details = await Promise.allSettled(
    normalizedPools
      .filter((pool) => pool.id)
      .map((pool) => getAdminGiftPoolDetail(pool.id, authHeader))
  );
  const detailById = new Map();
  const errors = [];

  details.forEach((result) => {
    if (result.status === "fulfilled") {
      detailById.set(result.value.id, result.value);
      return;
    }

    errors.push(result.reason);
  });

  return {
    pools: normalizedPools.map((pool) => detailById.get(pool.id) || pool),
    errors,
  };
}

export async function createAdminGiftPool(record, authHeader) {
  const payload = await requestJson(ADMIN_ENDPOINTS.giftPools, {
    method: "POST",
    body: buildGiftPoolPayload(record),
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.giftPools),
    },
  });

  return normalizeAdminGiftPool(getResponseRecord(payload), record);
}

export async function updateAdminGiftPool(id, record, authHeader) {
  const endpoint = getAdminGiftPoolEndpoint(id);
  const payload = await requestJson(endpoint, {
    method: "PUT",
    body: buildGiftPoolPayload(record),
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return normalizeAdminGiftPool(getResponseRecord(payload), {
    ...record,
    id,
  });
}

export async function deleteAdminGiftPool(id, authHeader) {
  const endpoint = getAdminGiftPoolEndpoint(id);

  return requestJson(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });
}

export async function addAdminGiftPoolAccount(record, authHeader) {
  const payload = buildPoolAccountPayload(record);

  await requestJson(ADMIN_ENDPOINTS.giftPoolsAddAccount, {
    method: "POST",
    body: payload,
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.giftPoolsAddAccount),
    },
  });

  return createPoolAccountMapping(payload.poolId, payload.accountId);
}

export async function addAdminGiftPoolAccounts(record, authHeader) {
  const payload = buildPoolAccountsPayload(record);

  await requestJson(ADMIN_ENDPOINTS.giftPoolsAddAccounts, {
    method: "POST",
    body: payload,
    headers: {
      Authorization: requireAuthHeader(authHeader, ADMIN_ENDPOINTS.giftPoolsAddAccounts),
    },
  });

  return payload.accountIds.map((accountId) =>
    createPoolAccountMapping(payload.poolId, accountId)
  );
}

export async function removeAdminGiftPoolAccounts(record, authHeader) {
  const payload = buildPoolAccountsPayload(record);

  await requestJson(ADMIN_ENDPOINTS.giftPoolsRemoveAccounts, {
    method: "POST",
    body: payload,
    headers: {
      Authorization: requireAuthHeader(
        authHeader,
        ADMIN_ENDPOINTS.giftPoolsRemoveAccounts
      ),
    },
  });

  return payload.accountIds.map((accountId) =>
    createPoolAccountMapping(payload.poolId, accountId)
  );
}
