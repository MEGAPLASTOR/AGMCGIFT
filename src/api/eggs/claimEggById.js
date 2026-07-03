import { EGG_ENDPOINTS } from "../endpoints/eggEndpoints";
import { postJson } from "../http/postJson";

export function claimEggById(orderId, eggType) {
  return postJson(EGG_ENDPOINTS.claim, {
    orderId,
    eggType: Number(eggType || 0) || 1,
  });
}
