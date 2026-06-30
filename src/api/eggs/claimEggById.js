import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";
import { postJson } from "../http/postJson";

// Gửi eggId đã chọn tới endpoint mở trứng.
export function claimEggById(eggId) {
  return postJson(EGG_ENDPOINTS.claim, { eggId });
}
