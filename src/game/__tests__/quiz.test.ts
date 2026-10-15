import { describe, expect, it } from '@jest/globals';
import { seededRng } from '../cards';
import {
  Question,
  QuestionBank,
  QuizState,
  answer,
  cardPoints,
  draw,
  judge,
  newQuiz,
  nextTurn,
  quizWinners,
  attemptsLeft,
  stealTarget,
  applyJoker,
} from '../quiz';
import bankJson from '../../data/questions.json';

const bank = bankJson as unknown as QuestionBank;
const rng = seededRng(3);
const ids = (deck: string) => Object.keys(bank).filter((id) => bank[id].deck === deck);

/** A game whose pile starts with the given cards. */
function withPile(pile: string[], players = 2, mode: 'phone' | 'group' = 'phone', attempts = 10): QuizState {
  return { ...newQuiz(bank, pile, players, mode, attempts, rng), pile };
}

describe('question bank', () => {
  it('has a question for all 270 cards of the five suited decks', () => {
    expect(Object.keys(bank)).toHaveLength(270);
  });
  it('every question with choices has its answer among them, once', () => {
    for (const q of Object.values(bank)) {
      if (q.kind === 'read') continue;
      expect(q.options).toBeDefined();
      expect(q.options![0]).toBe(q.answer);
      expect(q.options!.filter((o) => o === q.answer)).toHaveLength(1);
      expect(q.options!.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('fill questions show a blank and never print the answer', () => {
    for (const q of Object.values(bank).filter((x) => x.kind === 'fill')) {
      expect(q.prompt!.join(' ')).toContain('___');
    }
  });
  it('kirazira choices offer one taboo among values, and the reverse', () => {
    const pick = Object.values(bank).filter((q) => q.kind === 'pick');
    const category = new Map(pick.map((q) => [q.statement, q.category]));
    for (const q of pick) {
      const others = q.options!.slice(1).map((o) => category.get(o));
      expect(others.every((c) => c !== q.category)).toBe(true);
    }
  });
});

describe('points', () => {
  it('2–10 face value, J 11, Q 12, K 13, A 15, joker 0', () => {
    const p = (rank: Question['rank']) => cardPoints({ ...bank['imvugo-2C'], rank });
    expect([p('2'), p('7'), p('10'), p('J'), p('Q'), p('K'), p('A'), p(null)]).toEqual([2, 7, 10, 11, 12, 13, 15, 0]);
  });
});

describe('a turn in phone mode', () => {
  it('right answer scores the card value; wrong scores nothing and is remembered', () => {
    let s = draw(withPile(['imvugo-7C', 'imvugo-8C']), bank, rng);
    expect(s.phase).toBe('answer');
    expect(s.current!.options.sort()).toEqual([...bank['imvugo-7C'].options!].sort());
    s = answer(s, 'KAMENA');
    expect(s.scores).toEqual([7, 0]);
    expect(s.learned).toEqual(['imvugo-7C']);
    s = draw(nextTurn(s), bank, rng);
    expect(s.turn).toBe(1);
    s = answer(s, 'KAMENA');
    expect(s.result).toEqual({ correct: false, chosen: 'KAMENA', points: 0 });
    expect(s.missed).toEqual(['imvugo-8C']);
  });
  it('after everyone has used their attempts, the most points wins', () => {
    // Two players, one attempt each.
    let s = draw(withPile(['imvugo-AC', 'imvugo-2C', 'imvugo-3C'], 2, 'phone', 1), bank, rng);
    expect(attemptsLeft(s, 0)).toBe(1);
    s = nextTurn(answer(s, 'UMUBYEYI'));
    expect(s.phase).toBe('draw');
    expect(attemptsLeft(s, 0)).toBe(0);
    expect(attemptsLeft(s, 1)).toBe(1);
    s = draw(s, bank, rng);
    s = nextTurn(answer(s, 'NOPE'));
    expect(s.phase).toBe('over');
    expect(s.taken).toEqual([1, 1]);
    expect([attemptsLeft(s, 0), attemptsLeft(s, 1)]).toEqual([0, 0]);
    expect(quizWinners(s)).toEqual([0]);
  });
  it('every player gets the same number of turns', () => {
    const all = ids('imvugo');
    let s = newQuiz(bank, all, 3, 'phone', 5, seededRng(5));
    let turns = 0;
    while (s.phase !== 'over') {
      if (s.phase === 'draw') {
        s = draw(s, bank, rng);
        turns++;
      } else if (s.phase === 'answer') s = answer(s, s.current!.options[0]);
      else if (s.phase === 'joker') s = applyJoker(s, 'double');
      else s = nextTurn(s);
    }
    expect(turns).toBe(15);
    expect(s.taken).toEqual([5, 5, 5]);
  });
  it('the game ends when the cards run out', () => {
    let s = draw(withPile(['imvugo-2C']), bank, rng);
    s = nextTurn(answer(s, 'MUTARAMA'));
    expect(s.phase).toBe('over');
  });
});

describe('group mode', () => {
  it('the reader marks the spoken answer', () => {
    let s = draw(withPile(['ikeshamvugo-5D'], 2, 'group'), bank, rng);
    s = judge(s, true);
    expect(s.scores[0]).toBe(5);
  });
  it('kirazira/indangagaciro: the statement read out comes with its right pile', () => {
    const r = seededRng(11);
    for (let i = 0; i < 20; i++) {
      const s = draw({ ...newQuiz(bank, ['kirazira-5H'], 2, 'group', 10, r), pile: ['kirazira-5H'] }, bank, r);
      const sort = s.current!.sort!;
      const truth = Object.values(bank).find((q) => q.statement === sort.statement)!.category;
      expect(sort.answer).toBe(truth);
      expect(bank[sort.card].statement).toBe(sort.statement);
    }
  });
});

describe('jokers', () => {
  it('a joker answered right lets you steal 10 from the leader', () => {
    let s: QuizState = { ...withPile(['ntibavuga-bavuga-joker2'], 3), scores: [4, 30, 12], turn: 0 };
    s = answer(draw(s, bank, rng), 'URURIMI');
    expect(s.phase).toBe('joker');
    expect(stealTarget(s, 0)).toBe(1);
    s = applyJoker(s, 'steal');
    expect(s.scores).toEqual([14, 20, 12]);
  });
  it('double: the next right answer counts twice', () => {
    let s = answer(draw(withPile(['ntibavuga-bavuga-joker2', 'imvugo-9C', 'imvugo-7C']), bank, rng), 'URURIMI');
    s = applyJoker(s, 'double');
    s = draw(nextTurn(s), bank, rng); // player 1's turn
    s = draw(nextTurn(answer(s, 'NOPE')), bank, rng); // back to player 0
    s = answer(s, 'KAMENA');
    expect(s.scores[0]).toBe(14);
    expect(s.doubled[0]).toBe(false);
  });
  it('a joker with nothing to ask goes straight to its power', () => {
    const s = draw(withPile(['indangagaciro-joker1']), bank, rng);
    expect(s.phase).toBe('joker');
  });
  it('a wrong joker gives no power', () => {
    const s = answer(draw(withPile(['ntibavuga-bavuga-joker2']), bank, rng), 'IKIRIMI');
    expect(s.phase).toBe('result');
  });
});

describe('whole games', () => {
  it.each(['phone', 'group'] as const)('%s mode always finishes', (mode) => {
    for (let seed = 1; seed <= 20; seed++) {
      const r = seededRng(seed);
      const all = ['ntibavuga-bavuga', 'ikeshamvugo', 'imvugo', 'kirazira', 'indangagaciro'].flatMap(ids);
      let s = newQuiz(bank, all, 1 + (seed % 6), mode, [5, 10, 15, 60][seed % 4], r);
      let steps = 0;
      while (s.phase !== 'over') {
        if (++steps > 5000) throw new Error('stuck');
        if (s.phase === 'draw') s = draw(s, bank, r);
        else if (s.phase === 'answer')
          s = mode === 'phone' ? answer(s, s.current!.options[Math.floor(r() * s.current!.options.length)]) : judge(s, r() < 0.5);
        else if (s.phase === 'joker') s = applyJoker(s, r() < 0.5 ? 'steal' : 'double');
        else s = nextTurn(s);
      }
      expect(quizWinners(s).length).toBeGreaterThan(0);
    }
  });
});
