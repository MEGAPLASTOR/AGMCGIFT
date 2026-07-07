import { useEffect, useMemo, useState } from "react";
import { FaFloppyDisk, FaRotateRight } from "react-icons/fa6";
import {
  confirmAdminAction,
  showAdminAlert,
} from "../../services/adminBrowserFeedback";
import {
  getAdminSystemConfigMap,
  SYSTEM_CONFIG_KEYS,
} from "../../services/adminSystemConfigService";

function normalizeBooleanString(value) {
  return String(value ?? "").trim().toLowerCase() === "true" ? "true" : "false";
}

function normalizeBanDayValue(value) {
  const numberValue = Number(value);

  return String(
    Number.isFinite(numberValue) && numberValue > 0
      ? Math.floor(numberValue)
      : 1
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}

function buildFormValues(rows) {
  const configMap = getAdminSystemConfigMap(rows);

  return {
    banDay: normalizeBanDayValue(
      configMap[SYSTEM_CONFIG_KEYS.banDay]?.configValue || "7"
    ),
    permanentBan: normalizeBooleanString(
      configMap[SYSTEM_CONFIG_KEYS.permanentBan]?.configValue || "false"
    ),
  };
}

export function AdminSystemConfigPanel({
  isRefreshing = false,
  onFetchConfigs,
  onUpdateConfigs,
}) {
  const [configs, setConfigs] = useState([]);
  const [formValues, setFormValues] = useState(() => buildFormValues([]));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const configMap = useMemo(() => getAdminSystemConfigMap(configs), [configs]);

  const loadConfigs = async ({ silent = false } = {}) => {
    if (!onFetchConfigs || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const rows = await onFetchConfigs();
      const nextRows = Array.isArray(rows) ? rows : [];

      setConfigs(nextRows);
      setFormValues(buildFormValues(nextRows));

      if (!silent) {
        showAdminAlert("Đã tải cấu hình hệ thống.");
      }
    } catch (loadError) {
      const message = loadError.message || "Không thể tải cấu hình hệ thống.";
      setError(message);
      showAdminAlert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchConfigs]);

  const updateField = (field, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const saveConfigs = async () => {
    if (!onUpdateConfigs || isSaving) {
      return;
    }

    const payload = {
      [SYSTEM_CONFIG_KEYS.banDay]: normalizeBanDayValue(formValues.banDay),
      [SYSTEM_CONFIG_KEYS.permanentBan]: normalizeBooleanString(
        formValues.permanentBan
      ),
    };

    if (!confirmAdminAction("Xác nhận cập nhật cấu hình khóa tài khoản?")) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const rows = await onUpdateConfigs(payload);
      const nextRows = Array.isArray(rows) ? rows : configs;

      setConfigs(nextRows);
      setFormValues(buildFormValues(nextRows));
      showAdminAlert("Đã cập nhật cấu hình hệ thống.");
    } catch (saveError) {
      const message = saveError.message || "Không thể cập nhật cấu hình hệ thống.";
      setError(message);
      showAdminAlert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isRefreshing || isLoading || isSaving;

  return (
    <section className="admin-panel admin-system-config-panel">
      <div className="admin-panel__head">
        <div>
          <span>Cấu hình khóa tài khoản</span>
          <h2>System Configs</h2>
          <p>
            Điều chỉnh luật `WARNING`, `TEMP_BANNED`, `BANNED` theo cấu hình backend
            mới đã launch.
          </p>
        </div>

        <button
          type="button"
          className="admin-light-button"
          disabled={isBusy}
          onClick={() => loadConfigs()}
        >
          <FaRotateRight aria-hidden="true" />
          {isBusy && !isSaving ? "Đang tải" : "Làm mới"}
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-system-config-grid">
        <article className="admin-system-config-card">
          <strong>BAN_DAY</strong>
          <span>Số ngày khóa tạm thời sau khi vi phạm hoàn/hủy đơn.</span>
          <small>
            Hiện tại: <b>{configMap[SYSTEM_CONFIG_KEYS.banDay]?.configValue || "-"}</b>
          </small>
          <small>
            Cập nhật: {formatDateTime(configMap[SYSTEM_CONFIG_KEYS.banDay]?.updatedAt)}
          </small>
        </article>

        <article className="admin-system-config-card">
          <strong>PERMANENT_BAN</strong>
          <span>Bật/tắt luật chuyển sang khóa vĩnh viễn ở lần vi phạm tiếp theo.</span>
          <small>
            Hiện tại:{" "}
            <b>
              {normalizeBooleanString(
                configMap[SYSTEM_CONFIG_KEYS.permanentBan]?.configValue
              ) === "true"
                ? "true"
                : "false"}
            </b>
          </small>
          <small>
            Cập nhật:{" "}
            {formatDateTime(configMap[SYSTEM_CONFIG_KEYS.permanentBan]?.updatedAt)}
          </small>
        </article>
      </div>

      <div className="admin-customer-form admin-system-config-form">
        <label>
          BAN_DAY
          <input
            min="1"
            step="1"
            type="number"
            value={formValues.banDay}
            onChange={(event) => updateField("banDay", event.target.value)}
          />
        </label>

        <label>
          PERMANENT_BAN
          <select
            value={formValues.permanentBan}
            onChange={(event) => updateField("permanentBan", event.target.value)}
          >
            <option value="false">false - giữ ở TEMP_BANNED</option>
            <option value="true">true - chuyển sang BANNED</option>
          </select>
        </label>
      </div>

      <p className="admin-system-config-note">
        Thay đổi chỉ áp dụng cho các lần kiểm tra tiếp theo khi khách hàng nhập code.
      </p>

      <div className="admin-crud-actions">
        <button type="button" disabled={isSaving} onClick={saveConfigs}>
          <FaFloppyDisk aria-hidden="true" />
          {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </section>
  );
}
