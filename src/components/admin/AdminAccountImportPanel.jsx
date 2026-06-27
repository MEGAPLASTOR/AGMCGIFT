import { useState } from "react";
import { parseAccountImportFile } from "../../services/accountImportService";

function getUploadSuccessMessage(payload) {
  const importedCount =
    payload?.accountsImported ??
    payload?.imported ??
    payload?.successCount ??
    payload?.count;

  if (payload?.message) {
    return payload.message;
  }

  if (Number.isFinite(Number(importedCount))) {
    return `Đã upload và nhập ${importedCount} account lên backend.`;
  }

  return "Đã upload file Excel lên backend.";
}

export function AdminAccountImportPanel({
  onImportGiftAccounts,
  onUploadGiftAccounts,
  onImported,
}) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      if (onUploadGiftAccounts) {
        const payload = await onUploadGiftAccounts(file);
        onImported(getUploadSuccessMessage(payload));
        return;
      }

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
        <span>Cột bắt buộc: username, password. Có thể thêm tier, platform, token.</span>
      </div>
      <label className="admin-file-button">
        {isImporting ? "Đang nhập..." : "Chọn file"}
        <input
          type="file"
          accept=".xlsx"
          disabled={isImporting}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
