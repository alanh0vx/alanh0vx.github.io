type SortableTile = { suit?: string; n?: number; honor?: string };
const suits = ['萬', '索', '筒'];
const honors = ['東', '南', '西', '北', '中', '發', '白'];
function rank(tile: SortableTile) {
  return tile.suit ? suits.indexOf(tile.suit) * 9 + (tile.n ?? 1) - 1 : 27 + honors.indexOf(tile.honor ?? '');
}
/** Return a sorted copy, retaining each physical tile's identity. */
export function sortHand<T extends SortableTile>(tiles: readonly T[]): T[] {
  return [...tiles].sort((a, b) => rank(a) - rank(b));
}
