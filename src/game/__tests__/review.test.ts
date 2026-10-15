import { describe, expect, it } from '@jest/globals';
import { seededRng } from '../cards';
import { emptyProgress, recordAnswer } from '../progress';
import { answerReview, currentTurn, newReview, nextReview, pickReview, reviewOver, reviewSummary } from '../review';

const ids = Array.from({ length: 30 }, (_, i) => `c${i}`);

describe('picking the daily review', () => {
  it('a new learner gets ten new cards', () => {
    const picked = pickReview(emptyProgress(), ids, seededRng(1));
    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
  });

  it('missed cards first, then half-learnt, then new, then known', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'c1', false, 10); // missed
    p = recordAnswer(p, 'c2', true, 10); // half-learnt
    for (const id of ids.slice(3)) p = recordAnswer(recordAnswer(p, id, true, 9), id, true, 10); // known
    p = recordAnswer(p, 'c5', false, 10); // missed again after being known
    const picked = pickReview(p, ids, seededRng(2), 5);
    expect(picked.slice(0, 2).sort()).toEqual(['c1', 'c5']);
    expect(picked[2]).toBe('c2');
    expect(picked[3]).toBe('c0'); // the only new card
    expect(picked).toHaveLength(5);
  });

  it('known cards answered longest ago come first', () => {
    let p = emptyProgress();
    for (const [i, id] of ids.entries()) p = recordAnswer(recordAnswer(p, id, true, 100 - i), id, true, 100 - i);
    expect(pickReview(p, ids, seededRng(3), 3)).toEqual(['c29', 'c28', 'c27']);
  });

  it('leaves out cards already reviewed in this sitting', () => {
    const first = pickReview(emptyProgress(), ids, seededRng(4));
    const second = pickReview(emptyProgress(), ids, seededRng(5), 10, first);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
    expect(pickReview(emptyProgress(), ids, seededRng(6), 10, ids)).toEqual([]);
  });
});

describe('playing the daily review', () => {
  it('a missed card comes back once at the end', () => {
    let r = newReview(['a', 'b']);
    r = nextReview(answerReview(r, false)); // a wrong
    r = nextReview(answerReview(r, true)); // b right
    expect(currentTurn(r)).toEqual({ card: 'a', again: true });
    r = nextReview(answerReview(r, false)); // a wrong again: not queued a third time
    expect(reviewOver(r)).toBe(true);
    expect(reviewSummary(r)).toEqual({ total: 2, rightFirst: 1, missed: ['a'], rightCards: ['b'] });
  });

  it('a card can only be answered once, and only answered cards move on', () => {
    let r = newReview(['a']);
    expect(nextReview(r)).toBe(r);
    r = answerReview(r, true);
    expect(answerReview(r, false)).toBe(r);
    r = nextReview(r);
    expect(reviewOver(r)).toBe(true);
    expect(reviewSummary(r).rightCards).toEqual(['a']);
  });
});
