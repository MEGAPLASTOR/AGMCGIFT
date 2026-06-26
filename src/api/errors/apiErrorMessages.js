import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";

export const API_CONNECTION_ERROR_MESSAGE =
  "Không kết nối được backend API. Kiểm tra server backend hoặc VITE_API_BASE_URL.";

export function getDefaultApiErrorMessage(status, endpoint) {
  if (status === 429) return "Thao tác quá nhanh.";

  if (endpoint === EGG_ENDPOINTS.sync && status === 400) {
    return "Mã đơn không hợp lệ hoặc khách hàng bị BAN.";
  }

  if (endpoint === EGG_ENDPOINTS.claim && status === 400) {
    return "Trứng chưa sẵn sàng, hết quà, hoặc trứng đã mở.";
  }

  return "API trả về lỗi.";
}
