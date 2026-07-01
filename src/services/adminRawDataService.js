import { getApiBaseUrl } from "../api/config/apiRuntimeConfig";
import { ADMIN_ENDPOINTS } from "../api/endpoints/adminEndpoints";
import { getDefaultApiErrorMessage } from "../api/errors/apiErrorMessages";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { readResponsePayload } from "../api/http/readResponsePayload";
import {
  fetchAdminGiftPoolDetails,
  getPoolAccountMappingsFromPools,
  normalizeAdminGiftAccount,
  normalizeAdminGiftPool,
} from "./adminGiftPoolService";
import { normalizeApiText } from "../api/eggs/utils/normalizeApiText";

const ABSOLUTE_SUCCESS_DAYS = 15;
const RAW_ENDPOINTS = [
  ["customers", ADMIN_ENDPOINTS.customers],
  ["eggs", ADMIN_ENDPOINTS.eggs],
  ["giftAccounts", ADMIN_ENDPOINTS.giftAccounts],
  ["giftPools", ADMIN_ENDPOINTS.giftPools],
  ["orders", ADMIN_ENDPOINTS.orders],
  ["products", ADMIN_ENDPOINTS.products],
];

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi tải dữ liệu.", {
      status: 401,
      payload: null,
      endpoint,
    });
  }

  return authHeader;
}

function getArrayPayload(payload, key) {
  const keyedData = payload?.data?.[key] || payload?.[key];
  const candidates = [
    payload,
    payload?.data,
    keyedData,
    keyedData?.items,
    keyedData?.content,
    keyedData?.records,
    payload?.data?.[key],
    payload?.data?.items,
    payload?.data?.content,
    payload?.data?.records,
    payload?.items,
    payload?.content,
    payload?.records,
    payload?.[key],
  ];

  const source = candidates.find((candidate) => Array.isArray(candidate));

  if (source) {
    return source;
  }

  return [];
}

async function fetchAdminRawEndpoint(key, endpoint, authHeader) {
  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: requireAuthHeader(authHeader, endpoint),
      },
    });
  } catch (error) {
    throw new ApiRequestError("Không kết nối được dữ liệu quản trị.", {
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

  return getArrayPayload(payload, key);
}

function normalizeDate(value) {
  return value || null;
}

function normalizeEggStatus(rawEgg) {
  const status = String(rawEgg.status || "").trim().toUpperCase();

  if (status === "CLAIMED") return "hatched";
  if (status === "CANCELLED" || status === "INVALIDATED" || status === "INVALIDED") {
    return "invalidated";
  }

  if (Number(rawEgg.eggType) === 2 && rawEgg.hatchAt) {
    return new Date(rawEgg.hatchAt).getTime() > Date.now() ? "incubating" : "ready";
  }

  return status ? status.toLowerCase() : "ready";
}

function getDeliveredAt(order) {
  return (
    order.deliveredAt ||
    order.delivered_at ||
    order.deliveryCompletedAt ||
    order.delivery_completed_at ||
    order.completedAt ||
    order.completed_at ||
    null
  );
}

function isOlderThanDays(dateValue, days) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return Date.now() - date.getTime() >= days * 24 * 60 * 60 * 1000;
}

function normalizeOrderStatus(order) {
  const statusText = normalizeApiText(
    [
      order.status,
      order.orderStatus,
      order.financialStatus,
      order.financial_status,
      order.deliveryStatus,
      order.delivery_status,
      order.fulfillmentStatus,
      order.fulfillment_status,
    ].join(" ")
  );

  if (
    statusText.includes("cancel") ||
    statusText.includes("huy") ||
    statusText.includes("chuyen hoan") ||
    statusText.includes("hoan tra") ||
    statusText.includes("tra hang") ||
    statusText.includes("returned") ||
    statusText.includes("refund")
  ) {
    return "Cancel";
  }

  if (statusText.includes("paid") || statusText.includes("tuyet doi")) {
    return "Paid";
  }

  if (
    statusText.includes("delivered") ||
    statusText.includes("completed") ||
    statusText.includes("success") ||
    statusText.includes("da giao")
  ) {
    return isOlderThanDays(getDeliveredAt(order), ABSOLUTE_SUCCESS_DAYS)
      ? "Paid"
      : "Pending";
  }

  return "Pending";
}

function uniqueById(rows) {
  const map = new Map();

  rows.forEach((row) => {
    if (row?.id && !map.has(row.id)) {
      map.set(row.id, row);
    }
  });

  return [...map.values()];
}

function normalizeCustomers(customers) {
  return customers.map((customer) => ({
    id: customer.id,
    customerCode:
      customer.customerCode || customer.customer_code || customer.code || "",
    customerName:
      customer.customerName || customer.customer_name || customer.name || "",
    status: customer.status || "",
    successCount: Number(customer.successCount || customer.success_count || 0),
    returnStreak: Number(customer.returnStreak || customer.return_streak || 0),
    warningCount: Number(customer.warningCount || customer.warning_count || 0),
    createdAt: normalizeDate(customer.createdAt || customer.created_at),
    updatedAt: normalizeDate(customer.updatedAt || customer.updated_at),
  }));
}

function normalizeGiftAccounts(accounts) {
  return accounts.map(normalizeAdminGiftAccount);
}

function normalizeGiftPools(pools) {
  return pools.map(normalizeAdminGiftPool);
}

function normalizeOrders(orders) {
  return orders.map((order) => ({
    id: order.id,
    order_code: order.orderCode || order.order_code,
    customer_code: order.customerCode,
    source_name: "Anh Gà MC Gift Code",
    total_price: Number(order.totalPrice || order.total_price || 0),
    financial_status: order.financialStatus || "",
    fulfillment_status: order.deliveryStatus || order.fulfillment_status || "",
    status: normalizeOrderStatus(order),
    created_at: normalizeDate(order.createdAt || order.created_at),
    updated_at: normalizeDate(order.updatedAt || order.updated_at || order.lastSyncedAt),
    delivered_at: normalizeDate(getDeliveredAt(order)),
    last_synced_at: normalizeDate(order.lastSyncedAt || order.last_synced_at),
  }));
}

function normalizeOrderItems(orders) {
  return orders.flatMap((order) =>
    (order.orderItems || []).map((item) => ({
      id: item.id,
      order_id: order.id,
      kv_product_id: item.kvProductId || item.kv_product_id || "",
      kv_variant_id: "",
      product_name:
        item.productName ||
        item.product_name ||
        item.fullName ||
        item.full_name ||
        item.name ||
        "",
      sku: item.sku || item.code || "",
      image_url: item.imageUrl || item.image_url || item.image || "",
      quantity: Number(item.quantity || 0),
    }))
  );
}

function normalizeProductEggMappings(products) {
  return products.flatMap((product) =>
    (product.mappings || []).map((mapping) => {
      const giftPool = mapping.giftPool || mapping.gift_pool || {};
      const eggType = Number(mapping.eggType ?? mapping.egg_type ?? 0);
      const productId =
        product.kvProductId || product.kv_product_id || product.productId || "";

      return {
        id: mapping.id || `${productId}:${eggType}`,
        kv_product_id: String(productId),
        kv_variant_id: mapping.kvVariantId || mapping.kv_variant_id || "",
        egg_type: eggType,
        gift_pool_id:
          mapping.poolId ||
          mapping.pool_id ||
          mapping.giftPoolId ||
          mapping.gift_pool_id ||
          giftPool.id ||
          "",
        egg_tier: mapping.eggTier || mapping.egg_tier || giftPool.tier || "",
        created_at: normalizeDate(mapping.createdAt || mapping.created_at),
        updated_at: normalizeDate(mapping.updatedAt || mapping.updated_at),
      };
    })
  );
}

function normalizeProducts(products) {
  return products.map((product) => ({
    id: String(product.kvProductId || ""),
    kvProductId: product.kvProductId,
    sku: product.sku || product.code || "",
    name: product.name,
    fullName: product.fullName,
    basePrice: product.basePrice || 0,
    imageUrl: product.imageUrl || "",
    lastSyncedAt: normalizeDate(product.lastSyncedAt),
  }));
}

function normalizeEggs(eggs) {
  return eggs.map((egg) => ({
    id: egg.id,
    order_id: egg.order?.id || "",
    account_id: egg.account?.id || "",
    gift_pool_id: egg.giftPool?.id || "",
    egg_type: Number(egg.eggType || 0),
    status: normalizeEggStatus(egg),
    hatch_at: normalizeDate(egg.hatchAt),
    created_at: normalizeDate(egg.createdAt),
    updated_at: normalizeDate(egg.updatedAt),
  }));
}

function deriveOrdersFromEggs(eggs) {
  return uniqueById(
    eggs
      .map((egg) => egg.order)
      .filter(Boolean)
      .map((order) => ({
        id: order.id,
        order_code: order.orderCode,
        source_name: "Anh Gà MC Gift Code",
        total_price: 0,
        financial_status: "",
        fulfillment_status: order.deliveryStatus || "",
        status: normalizeOrderStatus(order),
        created_at: "",
        updated_at: "",
        delivered_at: normalizeDate(getDeliveredAt(order)),
        last_synced_at: normalizeDate(order.lastSyncedAt || order.last_synced_at),
      }))
  );
}

function deriveAccountsFromEggs(eggs) {
  return normalizeGiftAccounts(eggs.map((egg) => egg.account).filter(Boolean));
}

function derivePoolsFromEggs(eggs) {
  return normalizeGiftPools(eggs.map((egg) => egg.giftPool).filter(Boolean));
}

function derivePoolsFromProducts(products) {
  return normalizeGiftPools(
    products
      .flatMap((product) => product.mappings || [])
      .map((mapping) => mapping.giftPool)
      .filter(Boolean)
  );
}

function mergeAdminRawRows(raw) {
  const customers = normalizeCustomers(raw.customers || []);
  const orders = normalizeOrders(raw.orders || []);
  const eggs = normalizeEggs(raw.eggs || []);
  const giftAccounts = normalizeGiftAccounts(raw.giftAccounts || []);
  const giftPools = normalizeGiftPools(raw.giftPools || []);
  const products = normalizeProducts(raw.products || []);

  return {
    customers,
    products,
    adminOrders: uniqueById([...orders, ...deriveOrdersFromEggs(raw.eggs || [])]),
    adminOrderItems: normalizeOrderItems(raw.orders || []),
    eggs,
    productEggMappings: normalizeProductEggMappings(raw.products || []),
    giftPools: uniqueById([
      ...giftPools,
      ...derivePoolsFromEggs(raw.eggs || []),
      ...derivePoolsFromProducts(raw.products || []),
    ]),
    giftAccounts: uniqueById([
      ...giftAccounts,
      ...deriveAccountsFromEggs(raw.eggs || []),
    ]),
    poolAccountMappings: uniqueById(getPoolAccountMappingsFromPools(giftPools)),
    eggOpeningLogs: [],
  };
}

export async function fetchAdminRawTables(authHeader) {
  const results = await Promise.allSettled(
    RAW_ENDPOINTS.map(async ([key, endpoint]) => [
      key,
      await fetchAdminRawEndpoint(key, endpoint, authHeader),
    ])
  );
  const raw = {};
  const errors = [];

  results.forEach((result, index) => {
    const [key, endpoint] = RAW_ENDPOINTS[index];

    if (result.status === "fulfilled") {
      const [, rows] = result.value;
      raw[key] = rows;
      return;
    }

    errors.push({
      key,
      endpoint,
      status: result.reason?.status || 0,
      payload: result.reason?.payload || null,
      message: result.reason?.message || "Không tải được dữ liệu.",
    });
  });

  if (!Object.keys(raw).length) {
    const firstError = errors[0];

    throw new ApiRequestError(
      firstError?.message || "Không tải được dữ liệu quản trị.",
      {
        status: firstError?.status || 0,
        payload: firstError?.payload || null,
        endpoint: firstError?.endpoint || ADMIN_ENDPOINTS.eggs,
      }
    );
  }

  if (raw.giftPools?.length) {
    const detailResult = await fetchAdminGiftPoolDetails(raw.giftPools, authHeader);

    raw.giftPools = detailResult.pools;

    if (detailResult.errors.length) {
      errors.push(
        ...detailResult.errors.map((error) => ({
          key: "giftPools",
          endpoint: error?.endpoint || ADMIN_ENDPOINTS.giftPools,
          status: error?.status || 0,
          payload: error?.payload || null,
          message: error?.message || "Không tải được chi tiết bể quà.",
        }))
      );
    }
  }

  return {
    ...mergeAdminRawRows(raw),
    __rawErrors: errors,
  };
}
