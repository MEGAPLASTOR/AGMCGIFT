import { useState } from "react";
import { parseAccountImportFile } from "../../services/accountImportService";

// BACKEND_ADMIN_IMPORT_ACCOUNT_EXCEL:
// Khi có backend thật, form này sẽ gọi API upload file account thay vì parse ở frontend.
export function AdminAccountImportPanel({ onImportGiftAccounts, onImported }) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const payload = await parseAccountImportFile(file);
      const result = onImportGiftAccounts(payload);
      const mappingMessage = result.mappingsImported
        ? ` và ${result.mappingsImported} liên kết kho`
        : "";

      onImported(`Đã nhập ${result.accountsImported} account${mappingMessage}.`);
    } catch (error) {
      onImported(error.message || "Không thể nhập file account.");
    } finally {
      event.target.value = "";
      setIsImporting(false);
    }
  };

  return (
    <div className="admin-account-import">
      <div>
        <strong>Nhập account từ Excel</strong>
        <span>Cột bắt buộc: username, password. Có thể thêm status, platform, token, pool_id.</span>
      </div>
      <label className="admin-file-button">
        {isImporting ? "Đang nhập..." : "Chọn file"}
        <input
          type="file"
          accept=".xlsx,.csv,.tsv,.txt"
          disabled={isImporting}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
