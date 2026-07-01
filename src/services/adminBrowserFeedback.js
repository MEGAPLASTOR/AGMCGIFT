import { toast } from "react-hot-toast";

function resolveToastType(message) {
  const normalizedMessage = String(message || "").trim().toLowerCase();

  if (
    normalizedMessage.startsWith("không") ||
    normalizedMessage.startsWith("vui lòng") ||
    normalizedMessage.includes("lỗi") ||
    normalizedMessage.includes("thất bại")
  ) {
    return "error";
  }

  if (
    normalizedMessage.startsWith("đã") ||
    normalizedMessage.includes("thành công")
  ) {
    return "success";
  }

  return "blank";
}

export function showAdminAlert(message) {
  if (!message) {
    return;
  }

  const text = String(message);
  const type = resolveToastType(text);

  if (type === "error") {
    return toast.error(text);
  }

  if (type === "success") {
    return toast.success(text);
  }

  return toast(text);
}

export function confirmAdminAction(message) {
  if (typeof window === "undefined") {
    return true;
  }

  return window.confirm(String(message));
}
