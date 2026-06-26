import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";
import { postJson } from "../http/postJson";

// BACKEND_API_SYNC_TRUNG:
// Frontend goi POST /api/eggs/sync voi body { code }.
// Backend dong bo don KiotViet/SAPO, kiem tra BAN/spam/trang thai giao hang,
// sau do tra danh sach eggs cho trang chon trung.
export function syncEggsByOrderCode(orderCode) {
  return postJson(EGG_ENDPOINTS.sync, { code: orderCode });
}
