import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminAuthorizationHeader,
  loginAdmin,
} from "../services/adminAuthService";

const STORAGE_KEY = "agmc_admin_session";
const JWT_EXPIRY_SKEW_MS = 30 * 1000;
const MAX_SESSION_TIMER_MS = 2_147_483_647;
const SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập JWT đã hết hạn. Vui lòng đăng nhập lại.";
const SESSION_RELOGIN_MESSAGE =
  "Phiên đăng nhập JWT hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại.";

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

function decodeJwtPayload(accessToken) {
  const payloadSegment = String(accessToken || "").split(".")[1];

  if (
    !payloadSegment ||
    typeof window === "undefined" ||
    typeof window.atob !== "function"
  ) {
    return null;
  }

  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedBase64));
  } catch {
    return null;
  }
}

function getJwtExpiresAt(session) {
  const exp = Number(decodeJwtPayload(session?.accessToken)?.exp);

  if (!Number.isFinite(exp)) {
    return null;
  }

  return exp * 1000;
}

function isSessionExpired(session) {
  const expiresAt = getJwtExpiresAt(session);

  return Boolean(expiresAt && expiresAt - JWT_EXPIRY_SKEW_MS <= Date.now());
}

function isAuthorizationError(error) {
  return error?.status === 401 || error?.status === 403;
}

function hasAuthorizationError(result) {
  if (isAuthorizationError(result)) {
    return true;
  }

  return (result?.__rawErrors || []).some(isAuthorizationError);
}

function readStoredAdminSessionResult() {
  const session = readStoredAdminSession();

  if (!session) {
    return { error: "", session: null };
  }

  if (isSessionExpired(session)) {
    clearStoredAdminSession();
    return { error: SESSION_EXPIRED_MESSAGE, session: null };
  }

  return { error: "", session };
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
  const [initialSession] = useState(readStoredAdminSessionResult);
  const [session, setSession] = useState(initialSession.session);
  const [error, setError] = useState(initialSession.error);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const admin = useMemo(
    () => createAdminSessionView(session, tables),
    [session, tables]
  );

  const requireRelogin = useCallback((message = SESSION_RELOGIN_MESSAGE) => {
    clearStoredAdminSession();
    setSession(null);
    setError(message);
  }, []);

  useEffect(() => {
    const expiresAt = getJwtExpiresAt(session);

    if (!expiresAt || typeof window === "undefined") {
      return undefined;
    }

    let timeoutId;
    const checkExpiry = () => {
      if (isSessionExpired(session)) {
        requireRelogin(SESSION_EXPIRED_MESSAGE);
        return;
      }

      timeoutId = window.setTimeout(
        checkExpiry,
        Math.min(expiresAt - Date.now(), MAX_SESSION_TIMER_MS)
      );
    };

    timeoutId = window.setTimeout(
      checkExpiry,
      Math.min(
        Math.max(expiresAt - Date.now() - JWT_EXPIRY_SKEW_MS, 0),
        MAX_SESSION_TIMER_MS
      )
    );

    return () => window.clearTimeout(timeoutId);
  }, [requireRelogin, session]);

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

      if (isSessionExpired(nextSession)) {
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

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

  const handleAuthError = useCallback(
    (errorOrResult) => {
      if (!hasAuthorizationError(errorOrResult)) {
        return false;
      }

      requireRelogin(SESSION_RELOGIN_MESSAGE);
      return true;
    },
    [requireRelogin]
  );

  return {
    admin,
    authHeader: admin?.authHeader || "",
    error,
    handleAuthError,
    isLoggingIn,
    login,
    logout,
    requireRelogin,
  };
}
