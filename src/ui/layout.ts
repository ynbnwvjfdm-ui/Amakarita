/** Space between cards in a hand. */
export const HAND_GAP = 8;

/**
 * How to lay out a hand of n cards in rows so every card is whole and none
 * overlaps another: the number of columns that gives the biggest cards
 * while all rows fit in width × height.
 */
export function handLayout(n: number, width: number, height: number, maxCardWidth: number, ratio: number): { cardWidth: number; cols: number; rows: number } {
  let best = { cardWidth: 0, cols: Math.max(n, 1), rows: 1 };
  for (let rows = 1; rows <= Math.max(n, 1); rows++) {
    const cols = Math.ceil(n / rows);
    if (Math.ceil(n / cols) < rows) continue; // same as fewer rows
    const byWidth = (width - HAND_GAP * (cols - 1)) / cols;
    const byHeight = ((height - HAND_GAP * (rows - 1)) / rows) * ratio;
    const w = Math.floor(Math.min(maxCardWidth, byWidth, byHeight));
    if (w > best.cardWidth) best = { cardWidth: w, cols, rows };
  }
  return best;
}
