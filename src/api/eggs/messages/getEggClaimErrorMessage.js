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

  if (error.payload?.message) {
    return error.payload.message;
  }

  if (error.status === 400) {
    return "Trứng chưa sẵn sàng, hết quà, hoặc trứng đã được mở.";
  }

  return error.message || "Không kết nối được API mở trứng.";
}
