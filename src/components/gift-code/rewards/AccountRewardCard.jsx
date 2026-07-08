import { toast } from "react-hot-toast";

const SUPPORTED_TIERS = ["E", "D", "C", "B", "A", "S"];

function normalizeTier(value) {
  const tier = String(value || "").trim().toUpperCase();

  return SUPPORTED_TIERS.includes(tier) ? tier : "";
}

async function copyText(value) {
  const text = String(value || "").trim();

  if (!text) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // ponytail: fall through to textarea copy for older/insecure contexts.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function buildRows(note, username, password) {
  return [
    { key: "username", label: "Tài khoản", value: username },
    { key: "password", label: "Mật khẩu", value: password },
    { key: "note", label: "Ghi chú", value: note, full: true },
  ].filter((row) => row.value);
}

export function AccountRewardCard({
  reward,
  account,
  title = "Acc nhận được",
}) {
  const accountInfo = account || reward || {};
  const accountName =
    accountInfo.tenAcc || accountInfo.tenPhanThuong || accountInfo.platform;
  const username = accountInfo.taiKhoan || accountInfo.username;
  const password = accountInfo.matKhau || accountInfo.password;
  const tier = normalizeTier(accountInfo.tier);
  const displayTier = tier || "E";
  const platform = String(accountInfo.platform || "").trim();
  const note = accountInfo.ghiChu || accountInfo.message;
  const successMessage = note || "Chúc mừng! Bạn đã mở trứng thành công.";
  const rows = buildRows(note, username, password);

  const handleCopy = async (label, value) => {
    const copied = await copyText(value);

    if (copied) {
      toast.success(`Đã sao chép ${label.toLowerCase()}.`);
      return;
    }

    toast.error("Không thể sao chép lúc này.");
  };

  return (
    <div
      className={`tier-reward tier-reward--${displayTier.toLowerCase()}`}
      data-tier={displayTier}
    >
      <span className="tier-reward__art" aria-hidden="true">
        <span className="tier-reward__aura" />
        <span className="tier-reward__wings">
          <span className="tier-reward__wing tier-reward__wing--left" />
          <span className="tier-reward__wing tier-reward__wing--right" />
        </span>
        <span className="tier-reward__crest" />
      </span>
      <span className="tier-reward__tier-mark" aria-hidden="true">
        {displayTier}
      </span>

      <div className="tier-reward__banner">{successMessage}</div>

      <div className="tier-reward__hero">
        <div className="tier-reward__identity">
          <span className="tier-reward__seal" aria-hidden="true">
            {displayTier}
          </span>
          <div className="tier-reward__summary">
            <span>{title}</span>
            <strong>{accountName || "Acc Blox Fruit"}</strong>
            {platform ? (
              <em className="tier-reward__platform">{platform}</em>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="tier-reward__grid">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`tier-reward__field${
              row.full ? " tier-reward__field--full" : ""
            }`}
          >
            <div className="tier-reward__field-head">
              <dt>{row.label}</dt>
              <button
                type="button"
                className="tier-reward__copy"
                onClick={() => handleCopy(row.label, row.value)}
              >
                Copy
              </button>
            </div>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
