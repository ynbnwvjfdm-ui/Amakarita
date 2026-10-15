import { describe, expect, it } from '@jest/globals';
import { seededRng } from '../cards';
import { askerOf, judgeRiddle, newRiddles, nextRiddle, riddlesLeft, riddleWinners, soma } from '../ibisakuzo';
import ibisakuzo from '../../data/decks/ibisakuzo.json';

const ids = ibisakuzo.cards.map((c) => c.id);

/** Plays one riddle: draw, judge, move on. */
const play = (s: ReturnType<typeof newRiddles>, correct: boolean) => nextRiddle(judgeRiddle(soma(s), correct));

describe('ibisakuzo', () => {
  it('the deck has 54 riddles, each with its riddle and its answer', () => {
    expect(ids).toHaveLength(54);
    for (const c of ibisakuzo.cards) {
      expect(c.riddle?.text.trim()).toBeTruthy();
      expect(c.answer?.text.trim()).toBeTruthy();
    }
  });

  it('the first player asks first, the second answers', () => {
    const s = newRiddles(ids, 2, 5, seededRng(1));
    expect(s.phase).toBe('sakwe');
    expect(s.turn).toBe(1);
    expect(askerOf(s)).toBe(0);
  });

  it('"Soma!" turns up the next riddle', () => {
    const s = newRiddles(ids, 2, 5, seededRng(2));
    const first = s.pile[0];
    const r = soma(s);
    expect(r.phase).toBe('riddle');
    expect(r.current).toBe(first);
    expect(r.pile).toHaveLength(53);
  });

  it('a right answer scores one point, a wrong one none; then the players swap', () => {
    let s = newRiddles(ids, 2, 5, seededRng(3));
    s = judgeRiddle(soma(s), true);
    expect(s.scores).toEqual([0, 1]);
    expect(s.learned).toHaveLength(1);
    s = nextRiddle(s);
    expect(s.turn).toBe(0);
    expect(askerOf(s)).toBe(1);
    s = judgeRiddle(soma(s), false);
    expect(s.scores).toEqual([0, 1]);
    expect(s.missed).toHaveLength(1);
  });

  it('each player answers exactly their attempts, then the game ends', () => {
    for (const attempts of [5, 10, 15]) {
      let s = newRiddles(ids, 2, attempts, seededRng(attempts));
      let riddles = 0;
      while (s.phase !== 'over') {
        s = play(s, riddles % 3 === 0);
        riddles++;
      }
      expect(s.taken).toEqual([attempts, attempts]);
      expect(riddles).toBe(attempts * 2);
    }
  });

  it('never asks the same riddle twice in a game', () => {
    let s = newRiddles(ids, 2, 15, seededRng(9));
    const asked: string[] = [];
    while (s.phase !== 'over') {
      s = soma(s);
      asked.push(s.current!);
      s = nextRiddle(judgeRiddle(s, true));
    }
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('counts attempts left, the riddle in play included', () => {
    let s = newRiddles(ids, 2, 5, seededRng(4));
    expect(riddlesLeft(s, 1)).toBe(5);
    s = soma(s);
    expect(riddlesLeft(s, 1)).toBe(4);
    s = judgeRiddle(s, true);
    expect(riddlesLeft(s, 1)).toBe(4);
    expect(riddlesLeft(s, 0)).toBe(5);
  });

  it('most points wins; equal points is a draw', () => {
    let s = newRiddles(ids, 2, 5, seededRng(5));
    // The second player answers first: right, wrong, right, wrong...
    let k = 0;
    while (s.phase !== 'over') s = play(s, s.turn === 1 || k++ % 2 === 0);
    expect(riddleWinners(s)).toEqual([1]);

    let d = newRiddles(ids, 2, 5, seededRng(6));
    while (d.phase !== 'over') d = play(d, true);
    expect(riddleWinners(d)).toEqual([0, 1]);
  });

  it('ends early if the riddles run out', () => {
    let s = newRiddles(ids.slice(0, 3), 2, 5, seededRng(7));
    let riddles = 0;
    while (s.phase !== 'over') {
      s = play(s, true);
      riddles++;
    }
    expect(riddles).toBe(3);
  });

  it('can put some riddles first', () => {
    const s = newRiddles(ids, 2, 5, seededRng(8), (list) => [...list].reverse());
    expect(s.pile[0]).toBe(ids[ids.length - 1]);
  });
});
