import { useEffect, useState } from "react";
import { showAdminAlert } from "../../services/adminBrowserFeedback";

export function AdminLoginPanel({ error, isLoading, onLogin, onLoginWithToken }) {
  const [loginMode, setLoginMode] = useState("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!error) {
      return;
    }

    showAdminAlert(error);
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loginMode === "credentials") {
      await onLogin({ username, password });
    } else {
      await onLoginWithToken(token);
    }
  };

  return (
    <section className="admin-login-card">
      <div>
        <p className="admin-eyebrow">Anh Gà MC Gift Code Admin</p>
        <h1>Đăng nhập quản trị</h1>
        <p>
          Quản lý đơn hàng gift code, trứng thưởng và kho tài khoản quà.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          type="button"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: loginMode === "credentials" ? "#3b82f6" : "#374151",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.2s"
          }}
          onClick={() => setLoginMode("credentials")}
        >
          Dùng Mật khẩu
        </button>
        <button
          type="button"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: loginMode === "token" ? "#3b82f6" : "#374151",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.2s"
          }}
          onClick={() => setLoginMode("token")}
        >
          Dùng JWT Token
        </button>
      </div>

      <form className="admin-login-form" onSubmit={handleSubmit}>
        {loginMode === "credentials" ? (
          <>
            <label>
              Tài khoản
              <input
                type="text"
                value={username}
                autoComplete="username"
                disabled={isLoading}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                disabled={isLoading}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </>
        ) : (
          <label>
            JWT Token
            <textarea
              rows={4}
              placeholder="Dán mã JWT token vào đây..."
              value={token}
              disabled={isLoading}
              style={{
                width: "100%",
                background: "#111827",
                color: "#f3f4f6",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "10px",
                fontSize: "12px",
                fontFamily: "monospace",
                resize: "vertical",
                lineHeight: "1.5",
                marginTop: "6px"
              }}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Vào dashboard"}
        </button>
      </form>
    </section>
  );
}
