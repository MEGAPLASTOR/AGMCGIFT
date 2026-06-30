import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";
import { postJson } from "../http/postJson";

// Gửi mã đơn để lấy danh sách trứng hợp lệ cho bước chọn quà.
export function syncEggsByOrderCode(orderCode) {
  return postJson(EGG_ENDPOINTS.sync, { orderCode });
}
