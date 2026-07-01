import { normalizeApiText } from "./normalizeApiText";

export function getDeliveryStatusKind(deliveryStatus) {
  const status = normalizeApiText(deliveryStatus);

  if (!status || status === "null" || status.includes("chua giao")) {
    return "not_delivered";
  }

  if (
    status.includes("chuyen hoan") ||
    status.includes("hoan") ||
    status.includes("returned") ||
    status.includes("refund")
  ) {
    return "returned";
  }

  if (
    status.includes("dang giao") ||
    status.includes("shipping") ||
    status.includes("delivering")
  ) {
    return "delivering";
  }

  if (
    status.includes("da giao") ||
    status.includes("delivered") ||
    status.includes("completed")
  ) {
    return "delivered";
  }

  return "unknown";
}
