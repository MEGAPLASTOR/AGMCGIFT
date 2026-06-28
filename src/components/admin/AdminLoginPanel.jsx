import { useState } from "react";

export function AdminLoginPanel({ error, isLoading, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin({ username, password });
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

      <form className="admin-login-form" onSubmit={handleSubmit}>
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
        {error ? <p className="admin-error">{error}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Vào dashboard"}
        </button>
      </form>
    </section>
  );
}
