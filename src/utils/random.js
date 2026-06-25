export function pickRandomItem(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}
