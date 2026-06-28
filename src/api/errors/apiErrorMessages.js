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

const ADMIN_GIFT_POOL_ENDPOINTS = [
  ADMIN_ENDPOINTS.giftPools,
  ADMIN_ENDPOINTS.giftPoolsAddAccount,
  ADMIN_ENDPOINTS.giftPoolsAddAccounts,
  ADMIN_ENDPOINTS.giftPoolsRemoveAccounts,
];

function isAdminGiftPoolEndpoint(endpoint) {
  return (
    ADMIN_GIFT_POOL_ENDPOINTS.includes(endpoint) ||
    String(endpoint || "").startsWith(`${ADMIN_ENDPOINTS.giftPools}/`)
  );
}

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

  if (isAdminGiftPoolEndpoint(endpoint) && (status === 401 || status === 403)) {
    return "PhiÃªn Ä‘Äƒng nháº­p admin háº¿t háº¡n hoáº·c khÃ´ng Ä‘á»§ quyá»n quáº£n lÃ½ bá»ƒ quÃ .";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status === 400) {
    return "Dá»¯ liá»‡u bá»ƒ quÃ  khÃ´ng há»£p lá»‡ hoáº·c bá»ƒ quÃ  Ä‘ang chá»©a trá»©ng liÃªn káº¿t.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status === 404) {
    return "KhÃ´ng tÃ¬m tháº¥y bá»ƒ quÃ  hoáº·c tÃ i khoáº£n.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status >= 500) {
    return "API bá»ƒ quÃ  Ä‘ang lá»—i phÃ­a backend.";
  }

  if (endpoint === EGG_ENDPOINTS.sync && status === 400) {
    return "Mã đơn không hợp lệ, khách hàng bị khóa, hoặc đơn hàng chưa đủ điều kiện nhận trứng.";
  }

  if (endpoint === EGG_ENDPOINTS.claim && status === 400) {
    return "Trứng chưa hết 15 ngày, đơn chưa an toàn, hết quà, hoặc trứng đã mở.";
  }

  return "API trả về lỗi.";
}
