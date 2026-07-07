import { getAdminCustomerStatusEndpoint } from "../api/endpoints/adminEndpoints";
import { ApiRequestError } from "../api/http/ApiRequestError";
import { requestJson } from "../api/http/requestJson";
import { normalizeCustomerStatus } from "../utils/customerStatus";

function requireAuthHeader(authHeader, endpoint) {
  if (!authHeader) {
    throw new ApiRequestError("Vui lòng đăng nhập admin trước khi cập nhật khách hàng.", {
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

function normalizeCustomer(customer, fallback = {}) {
  const source = customer || {};

  return {
    id: source.id || fallback.id,
    customerCode:
      source.customerCode ||
      source.customer_code ||
      fallback.customerCode ||
      fallback.customer_code ||
      "",
    customerName:
      source.customerName ||
      source.customer_name ||
      source.name ||
      fallback.customerName ||
      fallback.customer_name ||
      "",
    status: normalizeCustomerStatus(source.status || fallback.status),
    successCount: Number(
      source.successCount || source.success_count || fallback.successCount || 0
    ),
    returnStreak: Number(
      source.returnStreak || source.return_streak || fallback.returnStreak || 0
    ),
    warningCount: Number(
      source.warningCount || source.warning_count || fallback.warningCount || 0
    ),
    earlyHatchCredits: Number(
      source.earlyHatchCredits ??
        source.early_hatch_credits ??
        fallback.earlyHatchCredits ??
        0
    ),
    returnCount: Number(
      source.returnCount ??
        source.return_count ??
        fallback.returnCount ??
        fallback.return_count ??
        0
    ),
    unbanAt: normalizeDate(
      source.unbanAt ||
        source.unban_at ||
        fallback.unbanAt ||
        fallback.unban_at
    ),
    createdAt: normalizeDate(
      source.createdAt || source.created_at || fallback.createdAt
    ),
    updatedAt: normalizeDate(
      source.updatedAt || source.updated_at || fallback.updatedAt
    ),
  };
}

function getResponseRecord(payload) {
  return payload?.data || payload?.customer || payload;
}

function buildCustomerStatusPayload(record) {
  const status = normalizeCustomerStatus(record.status);

  if (!status) {
    throw new Error("Vui lòng nhập trạng thái khách hàng.");
  }

  return {
    status,
    returnStreak: Number(record.returnStreak ?? record.return_streak ?? 0),
    successCount: Number(record.successCount ?? record.success_count ?? 0),
    unbanAt: record.unbanAt || record.unban_at || null,
  };
}

export async function updateAdminCustomerStatus(customerCode, record, authHeader) {
  const normalizedCode = normalizeText(customerCode || record.customerCode);
  const endpoint = getAdminCustomerStatusEndpoint(normalizedCode);

  if (!normalizedCode) {
    throw new Error("Không tìm thấy mã khách hàng cần cập nhật.");
  }

  const payload = await requestJson(endpoint, {
    method: "PUT",
    body: buildCustomerStatusPayload(record),
    headers: {
      Authorization: requireAuthHeader(authHeader, endpoint),
    },
  });

  return normalizeCustomer(getResponseRecord(payload), record);
}
