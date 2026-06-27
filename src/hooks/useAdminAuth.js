import { useMemo, useState } from "react";
import {
  getAdminAuthorizationHeader,
  loginAdmin,
} from "../services/adminAuthService";

const STORAGE_KEY = "agmc_admin_session";

function normalizeStoredSession(value) {
  if (!value?.accessToken || !value?.username) {
    return null;
  }

  return {
    accessToken: value.accessToken,
    tokenType: value.tokenType || "Bearer",
    username: value.username,
    role: value.role || "ADMIN",
  };
}

function readStoredAdminSession() {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    return normalizeStoredSession(JSON.parse(storedValue));
  } catch {
    return null;
  }
}

function writeStoredAdminSession(session) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Session storage is optional; the current tab can still keep the token in React state.
  }
}

function clearStoredAdminSession() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Session storage is optional for the frontend dashboard.
  }
}

function findLocalAdmin(tables, username) {
  const normalizedUsername = String(username || "").trim().toLowerCase();

  return (tables.admins || []).find(
    (item) =>
      String(item.username || "")
        .trim()
        .toLowerCase() === normalizedUsername
  );
}

function createAdminSessionView(session, tables) {
  if (!session) {
    return null;
  }

  const localAdmin = findLocalAdmin(tables, session.username);
  const authHeader = getAdminAuthorizationHeader(session).Authorization;

  return {
    ...localAdmin,
    accessToken: session.accessToken,
    authHeader,
    full_name: localAdmin?.full_name || session.username,
    role: session.role || localAdmin?.role || "ADMIN",
    tokenType: session.tokenType || "Bearer",
    username: session.username,
  };
}

export function useAdminAuth(tables) {
  const [session, setSession] = useState(readStoredAdminSession);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const admin = useMemo(
    () => createAdminSessionView(session, tables),
    [session, tables]
  );

  const login = async ({ username, password }) => {
    const trimmedUsername = String(username || "").trim();

    if (!trimmedUsername || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu admin.");
      return false;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      const nextSession = await loginAdmin({
        username: trimmedUsername,
        password,
      });

      writeStoredAdminSession(nextSession);
      setSession(nextSession);
      return true;
    } catch (loginError) {
      setError(loginError.message || "Không đăng nhập được admin.");
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clearStoredAdminSession();
    setSession(null);
    setError("");
  };

  return {
    admin,
    authHeader: admin?.authHeader || "",
    error,
    isLoggingIn,
    login,
    logout,
  };
}
