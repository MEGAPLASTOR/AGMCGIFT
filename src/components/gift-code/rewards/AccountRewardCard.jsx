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

function buildRows(accountInfo, tier, note, accountName, username, password) {
  return [
    {
      key: "account-name",
      label: "Tên acc",
      value:
        accountName && accountName !== accountInfo.platform ? accountName : "",
    },
    { key: "username", label: "Tài khoản", value: username },
    { key: "password", label: "Mật khẩu", value: password },
    { key: "platform", label: "Nền tảng", value: accountInfo.platform },
    { key: "tier", label: "Tier", value: tier },
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
  const note = accountInfo.ghiChu || accountInfo.message;
  const rows = buildRows(
    accountInfo,
    tier,
    note,
    accountName,
    username,
    password
  );
  const copyAllText = rows
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

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
      className={`account-reward${
        tier ? ` account-reward--${tier.toLowerCase()}` : ""
      }`}
    >
      <span className="account-reward__ornament" aria-hidden="true">
        <span className="account-reward__aura" />
        <span className="account-reward__wings">
          <span className="account-reward__wing account-reward__wing--left" />
          <span className="account-reward__wing account-reward__wing--right" />
        </span>
        <span className="account-reward__crest" />
      </span>

      <div className="account-reward__head">
        <div className="account-reward__identity">
          <span className="account-reward__icon" aria-hidden="true">
            OK
          </span>
          <div className="account-reward__summary">
            <span>{title}</span>
            <strong>{accountName || "Acc Blox Fruit"}</strong>
          </div>
        </div>

        <div className="account-reward__actions">
          {tier ? (
            <span className="account-reward__tier-chip">Tier {tier}</span>
          ) : null}
          <button
            type="button"
            className="account-reward__copy-all"
            onClick={() => handleCopy("toàn bộ thông tin", copyAllText)}
            disabled={!copyAllText}
          >
            Sao chép tất cả
          </button>
        </div>
      </div>

      <dl className="account-reward__grid">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`account-reward__field${
              row.full ? " account-reward__note" : ""
            }`}
          >
            <div className="account-reward__field-head">
              <dt>{row.label}</dt>
              <button
                type="button"
                className="account-reward__copy"
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
