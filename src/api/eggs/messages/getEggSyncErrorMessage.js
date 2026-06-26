import { normalizeApiText } from "../utils/normalizeApiText";

export function getEggSyncErrorMessage(error) {
  if (error.status === 0) {
    return "Hệ thống kiểm tra đơn đang tạm ngắt kết nối. Vui lòng thử lại sau.";
  }

  if (error.status === 429) {
    return "Bạn thao tác quá nhanh, vui lòng thử lại sau.";
  }

  const customerStatus = normalizeApiText(error.payload?.customerStatus);

  if (customerStatus.includes("ban")) {
    return "Khách hàng đang bị BAN nên không thể nhận quà.";
  }

  if (error.status === 400) {
    return "Mã đơn không hợp lệ hoặc đơn hàng chưa đủ điều kiện nhận quà.";
  }

  return error.message || "Không kết nối được API kiểm tra mã đơn.";
}
