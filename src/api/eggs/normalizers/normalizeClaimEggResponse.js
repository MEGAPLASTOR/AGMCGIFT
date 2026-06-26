export function normalizeClaimEggResponse(payload) {
  return {
    tenAcc: payload?.platform || "Acc Blox Fruit",
    taiKhoan: payload?.username || "",
    matKhau: payload?.password || "",
    platform: payload?.platform || "",
    ghiChu: payload?.message || "",
    raw: payload,
  };
}
