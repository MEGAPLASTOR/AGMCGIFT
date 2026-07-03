import {
  ADMIN_ENDPOINTS,
  getAdminEggEarlyHatchApprovalEndpoint,
  getAdminEggHatchTimeEndpoint,
} from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";

function requireAuthHeader(authHeader, endpoint, action = "quản lý trứng") {
  if (!authHeader) {
    throw new ApiRequestError(`Vui lòng đăng nhập admin trước khi ${action}.`, {
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

function getResponseArray(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.items,
    payload?.records,
    payload?.groups,
    payload?.data?.items,
    payload?.data?.records,
    payload?.data?.groups,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function getResponseRecord(payload) {
  return payload?.data || payload?.egg || payload;
}

function normalizeEggDetail(egg) {
  return {
    eggId: normalizeText(egg?.eggId || egg?.egg_id || egg?.id),
    eggType: Number(egg?.eggType ?? egg?.egg_type ?? 0),
    hatchAt: egg?.hatchAt || egg?.hatch_at || null,
  };
}

function normalizeOrderGroup(order) {
  const eggs = Array.isArray(order?.eggs) ? order.eggs : [];

  return {
    orderId: normalizeText(order?.orderId || order?.order_id || order?.id),
    orderCode: normalizeText(order?.orderCode || order?.order_code || order?.code),
    skuDetails: normalizeText(order?.skuDetails || order?.sku_details || order?.sku || ""),
    eggs: eggs.map(normalizeEggDetail).filter((egg) => egg.eggId),
  };
}

export function normalizeEarlyHatchGroups(payload) {
  return getResponseArray(payload).map((group) => {
    const orders = Array.isArray(group?.orders) ? group.orders : [];

    return {
      customerCode: normalizeText(
        group?.customerCode || group?.customer_code || group?.customerId || ""
      ),
      successCount: Number(group?.successCount ?? group?.success_count ?? 0),
      earlyHatchCredits: Number(
        group?.earlyHatchCredits ?? group?.early_hatch_credits ?? 0
      ),
      orders: orders.map(normalizeOrderGroup).filter((order) => order.orderId),
    };
  });
}

export async function fetchAdminEarlyHatchEligible(authHeader) {
  const endpoint = ADMIN_ENDPOINTS.eggsEarlyHatchEligible;
  const payload = await requestJson(endpoint, {
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint, "xem duyệt trứng sớm"),
    },
  });

  return normalizeEarlyHatchGroups(payload);
}

export async function updateAdminEggHatchTime(id, hatchAt, authHeader) {
  const endpoint = getAdminEggHatchTimeEndpoint(id);
  const payload = await requestJson(endpoint, {
    method: "PUT",
    body: { hatchAt },
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint, "sửa giờ ấp"),
    },
  });

  return getResponseRecord(payload);
}

export async function approveAdminEarlyHatch(id, authHeader) {
  const endpoint = getAdminEggEarlyHatchApprovalEndpoint(id);

  return requestJson(endpoint, {
    method: "POST",
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint, "duyệt trứng sớm"),
    },
  });
}
