import { normalizeEgg } from "./normalizeEgg.js";

function normalizeClaimedAccount(account, fallbackMessage = "") {
  const source = account || {};

  return {
    tenAcc: source.platform || "Acc Blox Fruit",
    taiKhoan: source.username || source.taiKhoan || "",
    matKhau: source.password || source.matKhau || "",
    token: source.token || "",
    platform: source.platform || "",
    tier: source.tier || "",
    ghiChu: source.message || fallbackMessage,
    raw: source,
  };
}

function getEggRows(root) {
  const candidates = [
    root.eggs,
    root.order?.eggs,
    root.data?.eggs,
    root.items,
    root.records,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

export function normalizeClaimEggResponse(payload) {
  const root = payload?.data || payload?.result || payload || {};
  const accounts = (
    Array.isArray(root.accounts)
      ? root.accounts
      : [root.account || root.giftAccount || root.reward || root]
  )
    .map((account) => normalizeClaimedAccount(account, root.message || ""))
    .filter(
      (account) =>
        account.taiKhoan || account.matKhau || account.platform || account.tier
    );
  const account = accounts[0] || normalizeClaimedAccount(root, root.message || "");
  const eggRows = getEggRows(root);
  const eggs = eggRows
    .map((rawEgg, index) => normalizeEgg(rawEgg, index, eggRows.length))
    .filter((egg) => egg.eggId);

  return {
    tenAcc: account.tenAcc || root.platform || "Acc Blox Fruit",
    taiKhoan: account.taiKhoan || root.username || "",
    matKhau: account.matKhau || root.password || "",
    token: account.token || root.token || "",
    platform: account.platform || root.platform || "",
    tier: account.tier || root.tier || "",
    ghiChu: root.message || account.ghiChu || "",
    reward: account,
    account,
    accounts,
    eggs,
    claimedCount: Number(root.claimedCount ?? accounts.length ?? 0),
    hatchingCount: Number(root.hatchingCount ?? 0),
    stuckCount: Number(root.stuckCount ?? 0),
    totalCount: Number(root.totalCount ?? eggs.length ?? 0),
    message: root.message || "",
    raw: root,
  };
}
