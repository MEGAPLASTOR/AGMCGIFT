import { normalizeApiText } from "../utils/normalizeApiText";

export function getEggClaimErrorMessage(error) {
  if (error.status === 0) {
    return "Hệ thống mở trứng đang tạm ngắt kết nối. Vui lòng thử lại sau.";
  }

  if (error.status === 429) {
    return "Bạn thao tác quá nhanh, vui lòng thử lại sau.";
  }

  if (error.status === 404) {
    return "Không tìm thấy API mở trứng. Vui lòng kiểm tra cấu hình proxy /api hoặc deploy lại frontend.";
  }

  const messageText = normalizeApiText(error.payload?.message || error.message);

  if (
    messageText.includes("chuyen hoan") ||
    messageText.includes("hoan tra") ||
    messageText.includes("tra hang") ||
    messageText.includes("returned") ||
    messageText.includes("refund")
  ) {
    return "Đơn hàng đã hoàn/trả, trứng bị hủy và không thể mở.";
  }

  if (
    messageText.includes("15") ||
    messageText.includes("absolute") ||
    messageText.includes("tuyet doi") ||
    messageText.includes("da giao") ||
    messageText.includes("delivered")
  ) {
    return "Trứng chỉ được mở khi đã hết 15 ngày và đơn đã giao an toàn.";
  }

  if (
    messageText.includes("cooldown") ||
    messageText.includes("incubat") ||
    messageText.includes("chua san sang") ||
    messageText.includes("not ready")
  ) {
    return "Trứng chưa hết thời gian ấp 15 ngày.";
  }

  if (error.payload?.message) {
    return error.payload.message;
  }

  if (error.status === 400) {
    return "Trứng chưa sẵn sàng, hết quà, hoặc trứng đã được mở.";
  }

  return error.message || "Không kết nối được API mở trứng.";
}
