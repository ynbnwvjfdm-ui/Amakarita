/**
 * "Amakarita", the question game.
 *
 * Players take turns drawing a card and answering its question. A right
 * answer scores the card's value (2–10 face value, J 11, Q 12, K 13, A 15).
 * A joker answered right (or a joker with nothing to ask) gives a power:
 * steal 10 points from the leader, or double your next right answer.
 *
 * Each player has the same number of attempts; every card drawn uses one.
 * When everyone has used theirs the highest score wins. If the cards run out
 * first, the game ends there and the highest score wins.
 *
 * Two ways to check answers:
 * - phone: the player taps one of the choices and the phone checks it.
 * - group: one person reads the question aloud, the player answers out
 *   loud, and the reader marks it right or wrong.
 */

import { Rank, Rng, Suit, shuffle } from './cards';

export type QuizMode = 'phone' | 'group';
export type Category = 'kirazira' | 'indangagaciro';

export interface Question {
  deck: string;
  card: string;
  rank: Rank | null;
  suit: Suit | null;
  kind: 'which' | 'fill' | 'pick' | 'read';
  /** The card's words with the answer blanked as "___". */
  prompt?: string[];
  answer?: string;
  /** For "which": the printed wrong forms. */
  wrong?: string[];
  /** Right answer first, then the wrong choices. */
  options?: string[];
  /** For "pick": the card's statement and which deck it belongs to. */
  statement?: string;
  category?: Category;
  /** A note for the author when the question needs checking. */
  review?: string;
}

export const STEAL = 10;
/** The attempts per player a game can be set to. */
export const ATTEMPT_CHOICES = [5, 10, 15];
const FACE: Partial<Record<Rank, number>> = { J: 11, Q: 12, K: 13, A: 15 };

export function cardPoints(q: Question): number {
  if (!q.rank) return 0;
  return FACE[q.rank] ?? Number(q.rank);
}

export const isJoker = (q: Question) => q.rank === null && q.card.includes('joker');

export interface Turn {
  question: Question;
  /** Choices in the order shown (phone mode). */
  options: string[];
  /** Group mode for Kirazira/Indangagaciro: the statement read out, its right pile and its card. */
  sort?: { statement: string; answer: Category; card: string };
}

export interface QuizResult {
  /** null for a card with nothing to ask. */
  correct: boolean | null;
  chosen: string | null;
  points: number;
}

export interface QuizState {
  mode: QuizMode;
  playerCount: number;
  /** Attempts each player gets. */
  attempts: number;
  /** Attempts each player has used so far. */
  taken: number[];
  scores: number[];
  /** A joker's double waiting for the player's next right answer. */
  doubled: boolean[];
  /** Card ids still to draw. */
  pile: string[];
  turn: number;
  current: Turn | null;
  result: QuizResult | null;
  phase: 'draw' | 'answer' | 'joker' | 'result' | 'over';
  /** Card ids answered right and wrong this game, for learning afterwards. */
  learned: string[];
  missed: string[];
}

export type QuestionBank = Record<string, Question>;

export function newQuiz(
  bank: QuestionBank,
  cardIds: string[],
  playerCount: number,
  mode: QuizMode,
  attempts: number,
  rng: Rng,
  /** Puts some cards first more often (a learner's missed cards); plain shuffle without it. */
  order?: (ids: string[], rng: Rng) => string[],
): QuizState {
  const ids = cardIds.filter((id) => bank[id]);
  const pile = order ? order(ids, rng) : shuffle(ids, rng);
  return {
    mode,
    playerCount,
    attempts,
    taken: Array.from({ length: playerCount }, () => 0),
    scores: Array.from({ length: playerCount }, () => 0),
    doubled: Array.from({ length: playerCount }, () => false),
    pile,
    turn: 0,
    current: null,
    result: null,
    phase: 'draw',
    learned: [],
    missed: [],
  };
}

export function draw(state: QuizState, bank: QuestionBank, rng: Rng): QuizState {
  if (state.phase !== 'draw') throw new Error(`Cannot draw during ${state.phase}`);
  if (state.pile.length === 0) return { ...state, phase: 'over' };
  const [id, ...pile] = state.pile;
  const question = bank[id];
  let sort: Turn['sort'];
  if (question.kind === 'pick' && state.mode === 'group') {
    // Read either this card's statement or one from the other deck, so the answer isn't always the same.
    const other = Object.values(bank).filter((q) => q.kind === 'pick' && q.category !== question.category);
    if (rng() < 0.5 && other.length) {
      const o = other[Math.floor(rng() * other.length)];
      sort = { statement: o.statement!, answer: o.category!, card: o.card };
    } else {
      sort = { statement: question.statement!, answer: question.category!, card: question.card };
    }
  }
  const options = question.options ? shuffle(question.options, rng) : [];
  const taken = state.taken.map((v, i) => (i === state.turn ? v + 1 : v));
  const s: QuizState = { ...state, pile, taken, current: { question, options, sort }, result: null };
  if (question.kind === 'read') {
    return isJoker(question)
      ? { ...s, result: { correct: null, chosen: null, points: 0 }, phase: 'joker' }
      : { ...s, result: { correct: null, chosen: null, points: 0 }, phase: 'result' };
  }
  return { ...s, phase: 'answer' };
}

/** Phone mode: the player picked `choice`. */
export function answer(state: QuizState, choice: string): QuizState {
  if (state.phase !== 'answer' || !state.current) throw new Error('No question to answer');
  const q = state.current.question;
  return score(state, choice === q.answer, choice);
}

/** Group mode: the reader marks the spoken answer. */
export function judge(state: QuizState, correct: boolean): QuizState {
  if (state.phase !== 'answer' || !state.current) throw new Error('No question to judge');
  return score(state, correct, null);
}

function score(state: QuizState, correct: boolean, chosen: string | null): QuizState {
  const q = state.current!.question;
  const seat = state.turn;
  const base = cardPoints(q);
  const points = correct ? base * (state.doubled[seat] && base > 0 ? 2 : 1) : 0;
  const s: QuizState = {
    ...state,
    scores: state.scores.map((v, i) => (i === seat ? v + points : v)),
    doubled: state.doubled.map((v, i) => (i === seat && correct && base > 0 ? false : v)),
    learned: correct ? [...state.learned, q.card] : state.learned,
    missed: correct ? state.missed : [...state.missed, q.card],
    result: { correct, chosen, points },
  };
  return { ...s, phase: correct && isJoker(q) ? 'joker' : 'result' };
}

/** The leader other than `seat`: who a steal takes from. */
export function stealTarget(state: QuizState, seat: number): number | null {
  let best: number | null = null;
  state.scores.forEach((v, i) => {
    if (i !== seat && v > 0 && (best === null || v > state.scores[best])) best = i;
  });
  return best;
}

export function applyJoker(state: QuizState, power: 'steal' | 'double'): QuizState {
  if (state.phase !== 'joker') throw new Error('No joker to use');
  const seat = state.turn;
  if (power === 'double') {
    return { ...state, doubled: state.doubled.map((v, i) => (i === seat ? true : v)), phase: 'result' };
  }
  const from = stealTarget(state, seat);
  if (from === null) return { ...state, phase: 'result' };
  const amount = Math.min(STEAL, state.scores[from]);
  const scores = state.scores.map((v, i) => (i === from ? v - amount : i === seat ? v + amount : v));
  return { ...state, scores, result: { ...state.result!, points: state.result!.points + amount }, phase: 'result' };
}

export function nextTurn(state: QuizState): QuizState {
  if (state.phase !== 'result') throw new Error(`Cannot move on during ${state.phase}`);
  if (state.taken.every((v) => v >= state.attempts) || state.pile.length === 0) {
    return { ...state, phase: 'over' };
  }
  return { ...state, turn: (state.turn + 1) % state.playerCount, current: null, phase: 'draw' };
}

/** Attempts the player whose turn it is has left, counting the one being played. */
export function attemptsLeft(state: QuizState, seat: number): number {
  const playing = state.phase === 'answer' || state.phase === 'joker' || state.phase === 'result';
  const inPlay = playing && seat === state.turn ? 1 : 0;
  return Math.max(0, state.attempts - state.taken[seat] + inPlay);
}

/** Seats with the highest score (more than one is a draw). */
export function quizWinners(state: QuizState): number[] {
  const best = Math.max(...state.scores);
  return state.scores.flatMap((v, i) => (v === best ? [i] : []));
}
