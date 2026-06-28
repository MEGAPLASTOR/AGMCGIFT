import { normalizeApiText } from "../utils/normalizeApiText";

export function getEggSyncErrorMessage(error) {
  if (error.status === 0) {
    return "Hệ thống kiểm tra đơn đang tạm ngắt kết nối. Vui lòng thử lại sau.";
  }

  if (error.status === 429) {
    return "Bạn thao tác quá nhanh, vui lòng thử lại sau.";
  }

  if (error.status === 404) {
    return "Không tìm thấy API kiểm tra mã đơn. Vui lòng kiểm tra cấu hình proxy /api hoặc deploy lại frontend.";
  }

  const customerStatus = normalizeApiText(
    error.payload?.customerStatus || error.payload?.customer?.status
  );
  const messageText = normalizeApiText(error.payload?.message || error.message);
  const orderStatus = normalizeApiText(
    [
      error.payload?.orderStatus,
      error.payload?.status,
      error.payload?.deliveryStatus,
      error.payload?.fulfillmentStatus,
      error.payload?.financialStatus,
    ].join(" ")
  );

  if (
    Number(error.payload?.returnStreak || error.payload?.customer?.returnStreak || 0) >= 2 ||
    customerStatus.includes("ban") ||
    customerStatus.includes("khoa") ||
    messageText.includes("vi pham") ||
    messageText.includes("bi khoa")
  ) {
    return "Tài khoản bị khóa do vi phạm chính sách.";
  }

  if (
    orderStatus.includes("chuyen hoan") ||
    orderStatus.includes("hoan tra") ||
    orderStatus.includes("tra hang") ||
    orderStatus.includes("returned") ||
    orderStatus.includes("refund") ||
    messageText.includes("hoan") ||
    messageText.includes("returned") ||
    messageText.includes("refund")
  ) {
    return "Đơn hàng đang hoàn/trả nên trứng liên quan đã bị hủy.";
  }

  if (error.status === 400) {
    return "Mã đơn không hợp lệ hoặc đơn hàng chưa đủ điều kiện nhận quà.";
  }

  return error.message || "Không kết nối được API kiểm tra mã đơn.";
}
