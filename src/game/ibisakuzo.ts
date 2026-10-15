/**
 * Ibisakuzo: riddles asked out loud, two players on one phone.
 *
 * One player asks and the other answers. The asker says "Sakwe sakwe!", the
 * other replies "Soma!", and the asker reads the riddle printed at the top
 * of the card. Once the other has answered, the asker uncovers the answer
 * printed at the bottom and says whether it was right: a right answer
 * scores one point. Then they swap. Each player answers the same number of
 * riddles (their attempts); when all are used, the most points wins.
 */

import { Rng, shuffle } from './cards';

export const RIDDLE_POINTS = 1;

export interface RiddleState {
  playerCount: number;
  /** Riddles each player answers. */
  attempts: number;
  /** Riddles each player has answered so far. */
  taken: number[];
  scores: number[];
  /** Card ids still to ask. */
  pile: string[];
  /** The player answering now; the player before them asks. */
  turn: number;
  /** The riddle being asked. */
  current: string | null;
  /** Whether it was answered right, once the asker has said. */
  correct: boolean | null;
  /**
   * sakwe:  "Sakwe sakwe!" – "Soma!", before the card is shown.
   * riddle: the riddle is asked and answered.
   * result: the asker has said whether it was right.
   */
  phase: 'sakwe' | 'riddle' | 'result' | 'over';
  /** Riddles answered right and wrong this game. */
  learned: string[];
  missed: string[];
}

/** The player asking the current riddle. */
export function askerOf(state: RiddleState): number {
  return (state.turn - 1 + state.playerCount) % state.playerCount;
}

/**
 * A new game. The first player asks first, so the second answers first.
 * `order` can put some riddles first (a learner's missed ones); plain shuffle without it.
 */
export function newRiddles(cardIds: string[], playerCount: number, attempts: number, rng: Rng, order?: (ids: string[], rng: Rng) => string[]): RiddleState {
  if (playerCount < 2) throw new Error('Ibisakuzo needs two players');
  return {
    playerCount,
    attempts,
    taken: Array(playerCount).fill(0),
    scores: Array(playerCount).fill(0),
    pile: order ? order(cardIds, rng) : shuffle(cardIds, rng),
    turn: 1 % playerCount,
    current: null,
    correct: null,
    phase: 'sakwe',
    learned: [],
    missed: [],
  };
}

/** "Soma!": the next riddle is turned up. */
export function soma(state: RiddleState): RiddleState {
  if (state.phase !== 'sakwe') throw new Error('No riddle to draw');
  if (!state.pile.length) return { ...state, phase: 'over' };
  const [current, ...pile] = state.pile;
  return { ...state, pile, current, correct: null, phase: 'riddle' };
}

/** The asker says whether the answer was right. */
export function judgeRiddle(state: RiddleState, correct: boolean): RiddleState {
  if (state.phase !== 'riddle' || !state.current) throw new Error('No riddle to judge');
  const seat = state.turn;
  return {
    ...state,
    taken: state.taken.map((v, i) => (i === seat ? v + 1 : v)),
    scores: state.scores.map((v, i) => (i === seat && correct ? v + RIDDLE_POINTS : v)),
    learned: correct ? [...state.learned, state.current] : state.learned,
    missed: correct ? state.missed : [...state.missed, state.current],
    correct,
    phase: 'result',
  };
}

/** On to the next riddle, with the players swapped; the game ends when every attempt is used. */
export function nextRiddle(state: RiddleState): RiddleState {
  if (state.phase !== 'result') throw new Error('Nothing to move on from');
  const done = state.taken.every((v) => v >= state.attempts) || state.pile.length === 0;
  if (done) return { ...state, current: null, phase: 'over' };
  let turn = (state.turn + 1) % state.playerCount;
  // Skip anyone who has used all their attempts (only matters with more than two players).
  while (state.taken[turn] >= state.attempts) turn = (turn + 1) % state.playerCount;
  return { ...state, turn, current: null, correct: null, phase: 'sakwe' };
}

/** Attempts a player has left, counting the riddle in play as used. */
export function riddlesLeft(state: RiddleState, seat: number): number {
  const inPlay = seat === state.turn && state.phase === 'riddle' ? 1 : 0;
  return Math.max(0, state.attempts - state.taken[seat] - inPlay);
}

/** The players with the most points (more than one on a draw). */
export function riddleWinners(state: RiddleState): number[] {
  const best = Math.max(...state.scores);
  return state.scores.flatMap((s, i) => (s === best ? [i] : []));
}
