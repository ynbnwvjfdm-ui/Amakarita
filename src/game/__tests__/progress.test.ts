import { describe, expect, it } from '@jest/globals';
import { seededRng } from '../cards';
import {
  DAILY_GOAL,
  KNOWN_BOX,
  answeredOn,
  cardStatus,
  countKnown,
  drawWeight,
  emptyProgress,
  medalFor,
  nextMedal,
  parseProgress,
  recordAnswer,
  streak,
  totalPoints,
  weightedOrder,
} from '../progress';
import { QuestionBank, cardPoints, newQuiz } from '../quiz';
import bankJson from '../../data/questions.json';

const bank = bankJson as unknown as QuestionBank;

describe('card progress', () => {
  it('a card is new, then learning, then known after two right answers in a row', () => {
    let p = emptyProgress();
    expect(cardStatus(p, 'imvugo-2C')).toBe('new');
    p = recordAnswer(p, 'imvugo-2C', true, 100);
    expect(cardStatus(p, 'imvugo-2C')).toBe('learning');
    p = recordAnswer(p, 'imvugo-2C', true, 101);
    expect(p.cards['imvugo-2C'].box).toBe(KNOWN_BOX);
    expect(cardStatus(p, 'imvugo-2C')).toBe('known');
  });

  it('a wrong answer sends the card back to the start', () => {
    let p = recordAnswer(recordAnswer(emptyProgress(), 'x', true, 1), 'x', true, 2);
    p = recordAnswer(p, 'x', false, 3);
    expect(p.cards.x).toEqual({ box: 0, right: 2, wrong: 1, last: 3 });
    expect(cardStatus(p, 'x')).toBe('learning');
  });

  it('counts known cards in a deck', () => {
    let p = emptyProgress();
    for (const id of ['a', 'b']) p = recordAnswer(recordAnswer(p, id, true, 1), id, true, 1);
    p = recordAnswer(p, 'c', true, 1);
    expect(countKnown(p, ['a', 'b', 'c', 'd'])).toBe(2);
  });
});

describe('daily goal and streak', () => {
  const answer = (p: ReturnType<typeof emptyProgress>, day: number, times: number) => {
    for (let i = 0; i < times; i++) p = recordAnswer(p, `c${day}-${i}`, true, day);
    return p;
  };
  it('counts answers per day', () => {
    const p = answer(answer(emptyProgress(), 5, 3), 6, 2);
    expect([answeredOn(p, 5), answeredOn(p, 6), answeredOn(p, 7)]).toEqual([3, 2, 0]);
  });
  it('a streak counts days in a row with the daily goal reached', () => {
    let p = emptyProgress();
    for (const d of [10, 12, 13]) p = answer(p, d, DAILY_GOAL);
    p = answer(p, 14, DAILY_GOAL - 1); // today, goal not yet reached
    expect(streak(p, 14)).toBe(2); // 12 and 13
    p = answer(p, 14, 1);
    expect(streak(p, 14)).toBe(3);
    expect(streak(p, 16)).toBe(0);
  });
  it('records each day once in the list of days played', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'a', true, 5);
    p = recordAnswer(p, 'b', false, 5);
    expect(p.days).toEqual([5]);
  });
  it('keeps about two months of daily counts', () => {
    let p = emptyProgress();
    for (let d = 1; d <= 100; d++) p = recordAnswer(p, 'x', true, d);
    expect(Object.keys(p.daily!).length).toBeLessThanOrEqual(60);
    expect(answeredOn(p, 100)).toBe(1);
  });
});

describe('medals', () => {
  it('bronze at a quarter of a deck, silver at 60%, gold when all are known', () => {
    expect(medalFor(13, 54)).toBeNull();
    expect(medalFor(14, 54)).toBe('bronze');
    expect(medalFor(33, 54)).toBe('silver');
    expect(medalFor(53, 54)).toBe('silver');
    expect(medalFor(54, 54)).toBe('gold');
  });
  it('says what the next medal needs', () => {
    expect(nextMedal(10, 54)).toEqual({ medal: 'bronze', more: 4 });
    expect(nextMedal(40, 54)).toEqual({ medal: 'gold', more: 14 });
    expect(nextMedal(54, 54)).toBeNull();
  });
});

describe('points', () => {
  it('every right answer adds its card value; wrong answers and jokers add nothing', () => {
    const value = (id: string) => (bank[id] ? cardPoints(bank[id]) : 0);
    let p = emptyProgress();
    p = recordAnswer(p, 'imvugo-6C', true, 1); // 6
    p = recordAnswer(p, 'imvugo-6C', true, 2); // 6 again
    p = recordAnswer(p, 'imvugo-AS', true, 2); // 15
    p = recordAnswer(p, 'imvugo-KH', false, 2); // wrong: 0
    p = recordAnswer(p, 'imvugo-joker1', true, 2); // joker: 0
    expect(totalPoints(p, value)).toBe(27);
    expect(totalPoints(emptyProgress(), value)).toBe(0);
  });
});

describe('missed cards come back sooner', () => {
  it('weights: just missed > half learnt > new > known', () => {
    let p = recordAnswer(emptyProgress(), 'missed', false, 1);
    p = recordAnswer(p, 'half', true, 1);
    p = recordAnswer(recordAnswer(p, 'known', true, 1), 'known', true, 2);
    const w = ['missed', 'half', 'fresh', 'known'].map((id) => drawWeight(p, id));
    expect(w).toEqual([5, 3, 2, 1]);
  });

  it('a missed card lands in the first ten of 54 far more often than chance', () => {
    const ids = Array.from({ length: 54 }, (_, i) => `c${i}`);
    const weight = (id: string) => (id === 'c0' ? 5 : 1);
    const rng = seededRng(7);
    let early = 0;
    for (let i = 0; i < 400; i++) if (weightedOrder(ids, weight, rng).indexOf('c0') < 10) early++;
    expect(early / 400).toBeGreaterThan(0.5); // chance alone would be about 0.19
  });

  it('keeps every card exactly once', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const out = weightedOrder(ids, () => 1, seededRng(3));
    expect([...out].sort()).toEqual(ids);
  });

  it('the question game can use the order', () => {
    const ids = Object.keys(bank).filter((id) => bank[id].deck === 'imvugo');
    const s = newQuiz(bank, ids, 1, 'phone', 5, seededRng(1), (list) => [...list].reverse());
    expect(s.pile[0]).toBe(ids[ids.length - 1]);
  });
});

describe('saved data', () => {
  it('reads back what was saved, and ignores anything broken', () => {
    const p = recordAnswer(emptyProgress(), 'a', true, 9);
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(parseProgress('not json')).toEqual(emptyProgress());
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress('{"version":2}')).toEqual(emptyProgress());
  });
});
