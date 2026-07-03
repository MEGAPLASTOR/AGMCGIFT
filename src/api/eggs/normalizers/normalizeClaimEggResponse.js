function normalizeClaimedAccount(account, fallbackMessage = "") {
  const source = account || {};

  return {
    tenAcc: source.platform || "Acc Blox Fruit",
    taiKhoan: source.username || source.taiKhoan || "",
    matKhau: source.password || source.matKhau || "",
    platform: source.platform || "",
    tier: source.tier || "",
    ghiChu: source.message || fallbackMessage,
    raw: source,
  };
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

  return {
    tenAcc: account.tenAcc || root.platform || "Acc Blox Fruit",
    taiKhoan: account.taiKhoan || root.username || "",
    matKhau: account.matKhau || root.password || "",
    platform: account.platform || root.platform || "",
    tier: account.tier || root.tier || "",
    ghiChu: root.message || account.ghiChu || "",
    reward: account,
    account,
    accounts,
    stuckCount: Number(root.stuckCount ?? 0),
    message: root.message || "",
    raw: root,
  };
}
