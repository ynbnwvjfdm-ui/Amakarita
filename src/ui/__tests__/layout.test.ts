import { describe, expect, it } from '@jest/globals';
import { HAND_GAP, handLayout } from '../layout';

const RATIO = 1230 / 1680;

describe('hand layout', () => {
  const sizes = [
    { width: 358, height: 230 },
    { width: 328, height: 160 },
    { width: 288, height: 120 },
  ];
  for (const { width, height } of sizes) {
    it(`fits 1 to 30 cards in ${width}×${height} without overlap`, () => {
      for (let n = 1; n <= 30; n++) {
        const { cardWidth, cols } = handLayout(n, width, height, 104, RATIO);
        const rows = Math.ceil(n / cols);
        expect(cardWidth).toBeGreaterThan(0);
        expect(cols * cardWidth + (cols - 1) * HAND_GAP).toBeLessThanOrEqual(width);
        expect(rows * (cardWidth / RATIO) + (rows - 1) * HAND_GAP).toBeLessThanOrEqual(height + 0.001);
      }
    });
  }

  it('uses two rows for a starting hand of seven on a normal phone', () => {
    const { cols, cardWidth } = handLayout(7, 358, 230, 104, RATIO);
    expect(cols).toBe(4);
    expect(cardWidth).toBeGreaterThanOrEqual(75);
  });

  it('never makes cards bigger than asked', () => {
    expect(handLayout(1, 358, 400, 104, RATIO).cardWidth).toBe(104);
  });
});
