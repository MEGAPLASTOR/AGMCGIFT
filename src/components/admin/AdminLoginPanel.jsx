import { useState } from "react";

export function AdminLoginPanel({ error, onLogin }) {
  const [username, setUsername] = useState("admin_01");
  const [password, setPassword] = useState("hash_demo_admin_01");

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ username, password });
  };

  return (
    <section className="admin-login-card">
      <div>
        <p className="admin-eyebrow">AGMC Admin</p>
        <h1>Đăng nhập dashboard</h1>
        <p>
          Khu vực quản trị vận hành đơn hàng, trứng thưởng và kho tài khoản.
        </p>
      </div>

      <form className="admin-login-form" onSubmit={handleSubmit}>
        <label>
          Tài khoản
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button type="submit">Vào dashboard</button>
      </form>
    </section>
  );
}
