import { getApiBaseUrl } from "../api/config/apiRuntimeConfig";
import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { getDefaultApiErrorMessage } from "../api/errors/apiErrorMessages";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { readResponsePayload } from "../api/http/readResponsePayload";

const RAW_ENDPOINT_STORAGE_KEY = "AGMC_ADMIN_RAW_ENDPOINT";
const RAW_TABLE_ENDPOINT_STORAGE_KEY = "AGMC_ADMIN_RAW_TABLE_ENDPOINT_TEMPLATE";

const TABLE_KEY_ALIASES = {
  admins: ["admins"],
  sapoOrders: ["sapoOrders", "sapo_orders"],
  sapoOrderItems: ["sapoOrderItems", "sapo_order_items"],
  eggs: ["eggs"],
  productEggMappings: ["productEggMappings", "product_egg_mappings"],
  giftPools: ["giftPools", "gift_pools"],
  giftAccounts: ["giftAccounts", "gift_accounts"],
  poolAccountMappings: ["poolAccountMappings", "pool_account_mappings"],
  eggOpeningLogs: ["eggOpeningLogs", "egg_opening_logs"],
};

const TABLE_ENDPOINTS = Object.entries(TABLE_KEY_ALIASES).map(
  ([tableKey, aliases]) => ({
    tableKey,
    snakeName: aliases[1] || aliases[0],
    kebabName: (aliases[1] || aliases[0]).replace(/_/g, "-"),
  })
);

function getRuntimeRawEndpoint() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage?.getItem(RAW_ENDPOINT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getRuntimeRawTableEndpointTemplate() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage?.getItem(RAW_TABLE_ENDPOINT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getAdminRawEndpoint() {
  return (
    import.meta.env.VITE_ADMIN_RAW_ENDPOINT ||
    getRuntimeRawEndpoint() ||
    ADMIN_ENDPOINTS.rawDatabase
  );
}

function getAdminRawTableEndpointTemplate() {
  return (
    import.meta.env.VITE_ADMIN_RAW_TABLE_ENDPOINT_TEMPLATE ||
    getRuntimeRawTableEndpointTemplate() ||
    ""
  );
}

function applyTableEndpointTemplate(template, table) {
  return template
    .replaceAll("{tableKey}", table.tableKey)
    .replaceAll("{table}", table.snakeName)
    .replaceAll("{snake}", table.snakeName)
    .replaceAll("{kebab}", table.kebabName);
}

function requireAuthHeader(authHeader) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi tải dữ liệu.", {
      status: 401,
      payload: null,
      endpoint: getAdminRawEndpoint(),
    });
  }

  return authHeader;
}

function unwrapRawPayload(payload) {
  return payload?.data?.tables || payload?.tables || payload?.data || payload || {};
}

function unwrapRowsPayload(payload) {
  const source =
    payload?.data?.rows ||
    payload?.data?.items ||
    payload?.data?.content ||
    payload?.data ||
    payload?.rows ||
    payload?.items ||
    payload?.content ||
    payload?.records ||
    payload?.result ||
    payload;

  return Array.isArray(source) ? source : [];
}

function normalizeTableListPayload(source) {
  if (!Array.isArray(source)) {
    return null;
  }

  return source.reduce((result, item) => {
    const tableKey = item?.key || item?.table || item?.name;
    const rows = item?.rows || item?.data || item?.items;

    if (tableKey && Array.isArray(rows)) {
      result[tableKey] = rows;
    }

    return result;
  }, {});
}

function pickTableRows(source, aliases) {
  const tableSource = normalizeTableListPayload(source) || source;

  for (const alias of aliases) {
    if (Array.isArray(tableSource?.[alias])) {
      return tableSource[alias];
    }
  }

  return [];
}

function getTableEndpointCandidates(table) {
  const template = getAdminRawTableEndpointTemplate();

  if (template) {
    return [applyTableEndpointTemplate(template, table)];
  }

  return [
    `${ADMIN_ENDPOINTS.rawDatabase}/${table.snakeName}`,
    `${ADMIN_ENDPOINTS.rawDatabase}/${table.kebabName}`,
    `${ADMIN_ENDPOINTS.rawDatabase}?table=${encodeURIComponent(table.snakeName)}`,
  ];
}

async function fetchJsonEndpoint(endpoint, authHeader) {
  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: requireAuthHeader(authHeader),
      },
    });
  } catch (error) {
    throw new ApiRequestError("Không kết nối được API raw database.", {
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

function getRawTableRecordCount(tables) {
  return Object.values(tables).reduce(
    (total, rows) => total + (Array.isArray(rows) ? rows.length : 0),
    0
  );
}

async function fetchRawTable(table, authHeader) {
  const errors = [];

  for (const endpoint of getTableEndpointCandidates(table)) {
    try {
      const payload = await fetchJsonEndpoint(endpoint, authHeader);
      return unwrapRowsPayload(payload);
    } catch (error) {
      errors.push(error);
    }
  }

  const lastError = errors.at(-1);

  throw new ApiRequestError(lastError?.message || "Không tải được bảng raw.", {
    status: lastError?.status || 0,
    payload: lastError?.payload || null,
    endpoint: lastError?.endpoint || getTableEndpointCandidates(table)[0],
  });
}

async function fetchRawTablesIndividually(authHeader) {
  const results = await Promise.allSettled(
    TABLE_ENDPOINTS.map(async (table) => [
      table.tableKey,
      await fetchRawTable(table, authHeader),
    ])
  );
  const tables = {};
  const errors = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const [tableKey, rows] = result.value;
      tables[tableKey] = rows;
      return;
    }

    errors.push(result.reason);
  });

  if (!Object.keys(tables).length) {
    const firstError = errors[0];

    throw new ApiRequestError(
      firstError?.message || "Không tải được dữ liệu raw database.",
      {
        status: firstError?.status || 0,
        payload: firstError?.payload || null,
        endpoint: firstError?.endpoint || ADMIN_ENDPOINTS.rawDatabase,
      }
    );
  }

  return normalizeAdminRawTables(tables);
}

export function normalizeAdminRawTables(payload) {
  const source = unwrapRawPayload(payload);

  return Object.fromEntries(
    Object.entries(TABLE_KEY_ALIASES).map(([tableKey, aliases]) => [
      tableKey,
      pickTableRows(source, aliases),
    ])
  );
}

export async function fetchAdminRawTables(authHeader) {
  const endpoint = getAdminRawEndpoint();

  try {
    const payload = await fetchJsonEndpoint(endpoint, authHeader);
    const tables = normalizeAdminRawTables(payload);

    if (getRawTableRecordCount(tables) > 0) {
      return tables;
    }
  } catch (error) {
    console.error("[AGMC API] Raw aggregate load failed", {
      endpoint,
      status: error.status,
      payload: error.payload,
    });
  }

  return fetchRawTablesIndividually(authHeader);
}
