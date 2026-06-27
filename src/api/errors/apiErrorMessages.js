import { ADMIN_ENDPOINTS } from "../endpoints/adminEndpoints";
import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";

export const API_CONNECTION_ERROR_MESSAGE =
  "Không kết nối được backend API. Kiểm tra server backend hoặc VITE_API_BASE_URL.";

const ADMIN_RAW_ENDPOINTS = [
  ADMIN_ENDPOINTS.customers,
  ADMIN_ENDPOINTS.eggs,
  ADMIN_ENDPOINTS.giftAccounts,
  ADMIN_ENDPOINTS.giftPools,
  ADMIN_ENDPOINTS.orders,
  ADMIN_ENDPOINTS.products,
];

export function getDefaultApiErrorMessage(status, endpoint) {
  if (status === 429) return "Thao tác quá nhanh.";

  if (
    endpoint === ADMIN_ENDPOINTS.login &&
    (status === 400 || status === 401 || status === 403)
  ) {
    return "Sai tài khoản hoặc mật khẩu admin.";
  }

  if (
    (endpoint === ADMIN_ENDPOINTS.giftAccountsSingle ||
      endpoint === ADMIN_ENDPOINTS.giftAccountsUpload) &&
    (status === 401 || status === 403)
  ) {
    return "Phiên đăng nhập admin hết hạn hoặc không đủ quyền.";
  }

  if (ADMIN_RAW_ENDPOINTS.includes(endpoint) && (status === 401 || status === 403)) {
    return "Phiên đăng nhập admin hết hạn hoặc không đủ quyền tải dữ liệu raw.";
  }

  if (ADMIN_RAW_ENDPOINTS.includes(endpoint) && status >= 500) {
    return "API raw database đang lỗi phía backend.";
  }

  if (
    (endpoint === ADMIN_ENDPOINTS.giftAccountsSingle ||
      endpoint === ADMIN_ENDPOINTS.giftAccountsUpload) &&
    status === 400
  ) {
    return "Dữ liệu tài khoản không hợp lệ.";
  }

  if (endpoint === EGG_ENDPOINTS.sync && status === 400) {
    return "Mã đơn không hợp lệ hoặc khách hàng bị BAN.";
  }

  if (endpoint === EGG_ENDPOINTS.claim && status === 400) {
    return "Trứng chưa sẵn sàng, hết quà, hoặc trứng đã mở.";
  }

  return "API trả về lỗi.";
}
