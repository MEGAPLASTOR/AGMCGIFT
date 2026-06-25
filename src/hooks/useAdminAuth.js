import { useMemo, useState } from "react";
import { authenticateAdmin } from "../services/adminDashboardService";

const STORAGE_KEY = "agmc_admin_session";

function readStoredAdminId() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredAdminId(adminId) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, adminId);
  } catch {
    // Session storage is optional for the raw frontend dashboard.
  }
}

function clearStoredAdminId() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Session storage is optional for the raw frontend dashboard.
  }
}

// BACKEND_ADMIN_PHIEN_DANG_NHAP:
// Frontend đang lưu tạm admin id trong sessionStorage để demo.
// Backend cần thay bằng token/session thật và API validate phiên đăng nhập.
export function useAdminAuth(tables) {
  const [storedAdminId, setStoredAdminId] = useState(readStoredAdminId);
  const [error, setError] = useState("");

  const admin = useMemo(
    () => (tables.admins || []).find((item) => item.id === storedAdminId),
    [storedAdminId, tables.admins]
  );

  const login = ({ username, password }) => {
    const matchedAdmin = authenticateAdmin(tables, username, password);

    if (!matchedAdmin) {
      setError("Sai tài khoản hoặc mật khẩu admin.");
      return false;
    }

    writeStoredAdminId(matchedAdmin.id);
    setStoredAdminId(matchedAdmin.id);
    setError("");
    return true;
  };

  const logout = () => {
    clearStoredAdminId();
    setStoredAdminId(null);
  };

  return { admin, error, login, logout };
}
