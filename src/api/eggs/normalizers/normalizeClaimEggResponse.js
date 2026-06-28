export function normalizeClaimEggResponse(payload) {
  const root = payload?.data || payload?.result || payload || {};
  const account = root.account || root.giftAccount || root.reward || root;

  return {
    tenAcc: account.platform || root.platform || "Acc Blox Fruit",
    taiKhoan: account.username || account.taiKhoan || root.username || "",
    matKhau: account.password || account.matKhau || root.password || "",
    platform: account.platform || root.platform || "",
    ghiChu: root.message || account.message || "",
    raw: root,
  };
}
