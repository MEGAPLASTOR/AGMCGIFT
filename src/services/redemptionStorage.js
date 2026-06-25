const REDEMPTIONS_KEY = "bloxfruit_giftcode_redemptions";

export function loadRedemptions() {
  try {
    const raw = localStorage.getItem(REDEMPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRedemption(record) {
  const redemptions = loadRedemptions();
  localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify([...redemptions, record]));
}

export function findRedemptionByCode(code) {
  return loadRedemptions().find(
    (item) => item.code.toUpperCase() === code.toUpperCase()
  );
}
