/**
 * The daily review: "today's 10 cards", for one learner.
 *
 * Picking: the cards the learner keeps missing come first (answered wrong
 * last time), then half-learnt ones, then new cards, then known cards that
 * have gone longest without an answer. Within each group the order is random.
 * A brand-new learner gets ten new cards.
 *
 * Playing: each card is answered once. A card answered wrong comes back once
 * after the ten, so it can be put right before the review ends. Every answer,
 * the second tries included, is saved like any other (daily goal, streak,
 * points), so nothing here keeps its own score.
 */

import { Rng, shuffle } from './cards';
import { KNOWN_BOX, Progress } from './progress';

export const REVIEW_SIZE = 10;

/** Up to `size` cards for a review, most needed first. `skip` holds cards already reviewed this sitting. */
export function pickReview(p: Progress, ids: string[], rng: Rng, size = REVIEW_SIZE, skip: string[] = []): string[] {
  const missed: string[] = [];
  const learning: string[] = [];
  const fresh: string[] = [];
  const known: string[] = [];
  const skipped = new Set(skip);
  for (const id of shuffle(ids, rng)) {
    if (skipped.has(id)) continue;
    const c = p.cards[id];
    if (!c) fresh.push(id);
    else if (c.box === 0) (c.wrong > 0 ? missed : fresh).push(id);
    else if (c.box < KNOWN_BOX) learning.push(id);
    else known.push(id);
  }
  // Known cards: the lowest box first, then the longest since last answered (sort keeps the shuffle for ties).
  known.sort((a, b) => p.cards[a].box - p.cards[b].box || p.cards[a].last - p.cards[b].last);
  return [...missed, ...learning, ...fresh, ...known].slice(0, size);
}

export interface ReviewTurn {
  card: string;
  /** The second go at a card answered wrong earlier in this review. */
  again: boolean;
}

export interface Review {
  turns: ReviewTurn[];
  /** The turn being played; equal to turns.length when the review is over. */
  pos: number;
  /** Answers given so far, one per turn. */
  results: boolean[];
}

export function newReview(cards: string[]): Review {
  return { turns: cards.map((card) => ({ card, again: false })), pos: 0, results: [] };
}

export const currentTurn = (r: Review): ReviewTurn | null => r.turns[r.pos] ?? null;
export const reviewOver = (r: Review) => r.pos >= r.turns.length;

/** Answers the current card. A first-time miss is queued again at the end. */
export function answerReview(r: Review, correct: boolean): Review {
  const turn = currentTurn(r);
  if (!turn || r.results.length > r.pos) return r;
  const turns = !correct && !turn.again ? [...r.turns, { card: turn.card, again: true }] : r.turns;
  return { ...r, turns, results: [...r.results, correct] };
}

/** Moves on once the current card is answered. */
export function nextReview(r: Review): Review {
  return r.results.length > r.pos ? { ...r, pos: r.pos + 1 } : r;
}

/** How the review went: cards right first time, cards missed first time, and every card answered right. */
export function reviewSummary(r: Review) {
  const firstTurns = r.turns.map((t, i) => ({ t, i })).filter(({ t }) => !t.again);
  const answered = firstTurns.filter(({ i }) => i < r.results.length);
  return {
    total: firstTurns.length,
    rightFirst: answered.filter(({ i }) => r.results[i]).length,
    missed: answered.filter(({ i }) => !r.results[i]).map(({ t }) => t.card),
    rightCards: r.turns.filter((_, i) => r.results[i]).map((t) => t.card),
  };
}
