import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";
import { postJson } from "../http/postJson";

// BACKEND_API_CLAIM_TRUNG:
// Frontend goi POST /api/eggs/claim voi body { eggId }.
// Backend kiem tra trung san sang, random account, khoa account bang transaction,
// ghi egg_opening_logs va chi tra username/password/platform dung mot lan.
export function claimEggById(eggId) {
  return postJson(EGG_ENDPOINTS.claim, { eggId });
}
