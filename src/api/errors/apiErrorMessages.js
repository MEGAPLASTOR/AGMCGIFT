import { ADMIN_ENDPOINTS } from "../endpoints/adminEndpoints";
import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";

export const API_CONNECTION_ERROR_MESSAGE =
  "Không kết nối được dịch vụ dữ liệu. Vui lòng kiểm tra VITE_API_BASE_URL.";

const ADMIN_DATA_ENDPOINTS = [
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

  if (ADMIN_DATA_ENDPOINTS.includes(endpoint) && (status === 401 || status === 403)) {
    return "Phiên đăng nhập admin hết hạn hoặc không đủ quyền tải dữ liệu.";
  }

  if (ADMIN_DATA_ENDPOINTS.includes(endpoint) && status >= 500) {
    return "Dữ liệu quản trị đang tạm thời gián đoạn.";
  }

  if (
    (endpoint === ADMIN_ENDPOINTS.giftAccountsSingle ||
      endpoint === ADMIN_ENDPOINTS.giftAccountsUpload) &&
    status === 400
  ) {
    return "Dữ liệu tài khoản không hợp lệ.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && (status === 401 || status === 403)) {
    return "Phiên đăng nhập admin hết hạn hoặc không đủ quyền quản lý bể quà.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status === 400) {
    return "Dữ liệu bể quà không hợp lệ hoặc bể quà đang chứa trứng liên kết.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status === 404) {
    return "Không tìm thấy bể quà hoặc tài khoản.";
  }

  if (isAdminGiftPoolEndpoint(endpoint) && status >= 500) {
    return "Dữ liệu bể quà đang tạm thời gián đoạn.";
  }

  if (endpoint === EGG_ENDPOINTS.sync && status === 400) {
    return "Mã đơn không hợp lệ, khách hàng bị khóa, hoặc đơn hàng chưa đủ điều kiện nhận trứng.";
  }

  if (endpoint === EGG_ENDPOINTS.claim && status === 400) {
    return "Trứng chưa hết 15 ngày, đơn chưa an toàn, hết quà, hoặc trứng đã mở.";
  }

  return "Hệ thống dữ liệu trả về lỗi.";
}
