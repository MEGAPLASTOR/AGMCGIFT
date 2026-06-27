import { useState } from "react";

// BACKEND_ADMIN_DOI_MAT_KHAU:
// Frontend hiện đổi password_hash trong state tạm để demo.
// Backend cần thay bằng API verify mật khẩu cũ, hash mật khẩu mới và cập nhật admins.updated_at.
export function AdminPasswordPanel({ admin, onChangePassword, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(admin.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewUsername(admin.username || "");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmedUsername = newUsername.trim();
    const isChangingUsername = Boolean(
      trimmedUsername && trimmedUsername !== admin.username
    );
    const isChangingPassword = Boolean(newPassword || confirmPassword);

    if (!currentPassword) {
      setMessage("Vui long nhap mat khau hien tai.");
      return;
    }

    if (!isChangingUsername && !isChangingPassword) {
      setMessage("Nhap username moi hoac mat khau moi de cap nhat.");
      return;
    }

    if (isChangingPassword && newPassword.length < 6) {
      setMessage("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    if (isChangingPassword && newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await onChangePassword({
        adminId: admin.id,
        currentPassword,
        newUsername: isChangingUsername ? trimmedUsername : "",
        newPassword: isChangingPassword ? newPassword : "",
      });

      setMessage(result.message || "Da cap nhat thong tin dang nhap.");

      if (result.ok !== false) {
        resetForm();
      }
    } catch (error) {
      setMessage(error.message || "Khong cap nhat duoc thong tin dang nhap.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="admin-panel admin-modal admin-password-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-password-title"
      >
        <div className="admin-panel__head">
          <div>
            <h2 id="admin-password-title">Bảo mật tài khoản</h2>
            <span>Đổi mật khẩu đăng nhập admin</span>
          </div>
          <div className="admin-modal-head-actions">
            <strong>{admin.username}</strong>
            <button type="button" className="admin-modal-close" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>

        <form className="admin-password-form" onSubmit={handleSubmit}>
          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            Tên đăng nhập mới
            <input
              type="text"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Mật khẩu mới
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label>
            Nhập lại mật khẩu mới
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Dang cap nhat..." : "Cập nhật mật khẩu"}
          </button>
        </form>

        {message ? <p>{message}</p> : null}
      </section>
    </div>
  );
}
