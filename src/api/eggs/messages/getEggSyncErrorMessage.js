import { getDeliveryStatusKind } from "../utils/getDeliveryStatusKind";
import { normalizeApiText } from "../utils/normalizeApiText";
import {
  CUSTOMER_STATUS,
  extractCustomerBanInfo,
  extractCustomerState,
} from "../../../utils/customerStatus";

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN");
}

export function getDeliveryStatusError(deliveryStatus) {
  const deliveryKind = getDeliveryStatusKind(deliveryStatus);

  if (deliveryKind === "not_delivered" || deliveryKind === "unknown") {
    return "Đơn hàng chưa được giao tới hãy đợi giao tới rồi nhập code nhé ^^";
  }

  if (deliveryKind === "returned") {
    return "Đơn hàng đã bị hoàn nên không đủ điều kiện nhận quà tri ân.";
  }

  if (deliveryKind === "delivering") {
    return "Đơn hàng đang giao tới hãy chờ thêm xíu nữa rồi nhập code lại sau nhé ^^";
  }

  return "";
}

export function getEggSyncErrorMessage(error) {
  if (error.status === 0) {
    return "Hệ thống kiểm tra đơn đang tạm ngắt kết nối. Vui lòng thử lại sau.";
  }

  if (error.status === 429) {
    return "Bạn thao tác quá nhanh, vui lòng thử lại sau.";
  }

  if (error.status === 404) {
    return (
      error.payload?.message ||
      error.message ||
      "Không tìm thấy mã đơn hàng này trên hệ thống."
    );
  }

  const banInfo = extractCustomerBanInfo(error.payload);
  const customerState = extractCustomerState(error.payload, "");
  const rawCustomerStatus = customerState.rawStatus;
  const customerStatus = customerState.status;
  const customerStatusText = normalizeApiText(rawCustomerStatus);
  const backendMessage = error.payload?.message || error.message || "";
  const messageText = normalizeApiText(backendMessage);
  const orderStatus = normalizeApiText(
    [
      error.payload?.orderStatus,
      error.payload?.status,
      error.payload?.deliveryStatus,
      error.payload?.fulfillmentStatus,
      error.payload?.financialStatus,
      error.payload?.order?.orderStatus,
      error.payload?.order?.status,
      error.payload?.order?.deliveryStatus,
      error.payload?.order?.fulfillmentStatus,
      error.payload?.order?.financialStatus,
    ].join(" ")
  );
  const rawDeliveryStatus =
    error.payload?.deliveryStatus ??
    error.payload?.delivery_status ??
    error.payload?.order?.deliveryStatus ??
    error.payload?.order?.delivery_status ??
    error.payload?.order?.fulfillmentStatus ??
    error.payload?.order?.fulfillment_status;
  const deliveryStatusError =
    rawDeliveryStatus === undefined ? "" : getDeliveryStatusError(rawDeliveryStatus);
  const unbanAt = banInfo?.unbanAt || customerState.unbanAt;

  if (
    banInfo?.type === CUSTOMER_STATUS.TEMP_BANNED ||
    customerStatus === CUSTOMER_STATUS.TEMP_BANNED ||
    customerStatusText.includes("temp_banned")
  ) {
    if (banInfo?.message) {
      return banInfo.message;
    }

    const formattedUnbanAt = formatDateTime(unbanAt);

    return formattedUnbanAt
      ? `Tài khoản đang bị khóa tạm thời đến ${formattedUnbanAt}. Vui lòng quay lại sau mốc này.`
      : "Tài khoản đang bị khóa tạm thời. Vui lòng quay lại sau khi hết thời gian khóa.";
  }

  if (
    banInfo?.type === CUSTOMER_STATUS.BANNED ||
    customerStatus === CUSTOMER_STATUS.BANNED ||
    customerStatusText.includes("banned") ||
    (customerStatusText.includes("ban") && !customerStatusText.includes("temp"))
  ) {
    return (
      banInfo?.message ||
      backendMessage ||
      "Tài khoản đã bị khóa vĩnh viễn do vi phạm chính sách."
    );
  }

  if (deliveryStatusError) {
    return deliveryStatusError;
  }

  if (
    orderStatus.includes("chuyen hoan") ||
    orderStatus.includes("hoan tra") ||
    orderStatus.includes("tra hang") ||
    orderStatus.includes("returned") ||
    orderStatus.includes("refund") ||
    messageText.includes("hoan") ||
    messageText.includes("returned") ||
    messageText.includes("refund")
  ) {
    return "Đơn hàng đang hoàn/trả nên gói quà liên quan đã bị hủy.";
  }

  if (error.status === 400) {
    return "Mã đơn không hợp lệ hoặc đơn hàng chưa đủ điều kiện nhận quà.";
  }

  return error.message || "Không kết nối được API kiểm tra mã đơn.";
}
