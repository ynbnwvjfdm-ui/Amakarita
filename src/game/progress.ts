/**
 * What a learner knows, card by card, kept on the phone.
 *
 * Each card sits in a box (Leitner): a right answer moves it up one box, a
 * wrong one sends it back to the first. Two right answers in a row and the
 * card counts as known. Cards in the low boxes come up sooner in the next
 * game, so the ones a learner keeps missing come back more often.
 *
 * Rewards: a daily goal of DAILY_GOAL answers keeps the streak going, and
 * each deck earns a bronze, silver and gold medal as more of it is known.
 */

import { Rng } from './cards';

export const KNOWN_BOX = 2;
const TOP_BOX = 5;
/** Answers a day that keep the streak alive. */
export const DAILY_GOAL = 10;
/** Share of a deck's cards known for each medal. */
export const MEDALS = [
  { medal: 'bronze', share: 0.25 },
  { medal: 'silver', share: 0.6 },
  { medal: 'gold', share: 1 },
] as const;
export type Medal = (typeof MEDALS)[number]['medal'];

export interface CardProgress {
  box: number;
  right: number;
  wrong: number;
  /** Day number (see dates.dayNumber) of the last answer. */
  last: number;
}

export interface Progress {
  version: 1;
  cards: Record<string, CardProgress>;
  /** Day numbers with at least one answer, oldest first, without repeats. */
  days: number[];
  /** Answers given per day (day number → count), for the daily goal. */
  daily?: Record<string, number>;
}

export type CardStatus = 'new' | 'learning' | 'known';

export const emptyProgress = (): Progress => ({ version: 1, cards: {}, days: [] });

/** Records one answer to a card on the given day. */
export function recordAnswer(p: Progress, cardId: string, correct: boolean, day: number): Progress {
  const c = p.cards[cardId] ?? { box: 0, right: 0, wrong: 0, last: day };
  const next: CardProgress = correct
    ? { box: Math.min(TOP_BOX, c.box + 1), right: c.right + 1, wrong: c.wrong, last: day }
    : { box: 0, right: c.right, wrong: c.wrong + 1, last: day };
  const days = p.days[p.days.length - 1] === day ? p.days : [...p.days, day].slice(-400);
  // Keep about two months of daily counts.
  const daily: Record<string, number> = { [day]: (p.daily?.[day] ?? 0) + 1 };
  for (const [d, n] of Object.entries(p.daily ?? {})) if (Number(d) > day - 60 && Number(d) !== day) daily[d] = n;
  return { ...p, cards: { ...p.cards, [cardId]: next }, days, daily };
}

export function answeredOn(p: Progress, day: number): number {
  return p.daily?.[day] ?? 0;
}

/** The best medal a deck has earned, from how many of its cards are known. */
export function medalFor(known: number, total: number): Medal | null {
  let best: Medal | null = null;
  for (const m of MEDALS) if (total > 0 && known >= Math.ceil(m.share * total)) best = m.medal;
  return best;
}

/** The next medal to aim for and how many more known cards it needs. */
export function nextMedal(known: number, total: number): { medal: Medal; more: number } | null {
  const m = MEDALS.find((x) => known < Math.ceil(x.share * total));
  return m ? { medal: m.medal, more: Math.ceil(m.share * total) - known } : null;
}

export function cardStatus(p: Progress, cardId: string): CardStatus {
  const c = p.cards[cardId];
  if (!c) return 'new';
  return c.box >= KNOWN_BOX ? 'known' : 'learning';
}

export function countKnown(p: Progress, cardIds: string[]): number {
  return cardIds.filter((id) => cardStatus(p, id) === 'known').length;
}

/**
 * Days in a row on which the daily goal was reached, ending today (or
 * yesterday, while today's goal is still open).
 */
export function streak(p: Progress, today: number): number {
  const met = (d: number) => answeredOn(p, d) >= DAILY_GOAL;
  let d = met(today) ? today : today - 1;
  let n = 0;
  while (met(d)) {
    n++;
    d--;
  }
  return n;
}

/**
 * Points earned so far: every right answer is worth its card's value (as in
 * the question game: number cards their number, J 11, Q 12, K 13, A 15).
 */
export function totalPoints(p: Progress, value: (cardId: string) => number): number {
  let sum = 0;
  for (const [id, c] of Object.entries(p.cards)) sum += c.right * value(id);
  return sum;
}

/** How strongly a card should come up early in a game. */
export function drawWeight(p: Progress, cardId: string): number {
  const c = p.cards[cardId];
  if (!c) return 2; // new
  if (c.box === 0) return c.wrong > 0 ? 5 : 2; // just missed
  if (c.box < KNOWN_BOX) return 3; // half learnt
  return 1; // known
}

/**
 * A random order in which heavier cards tend to come first (weighted
 * sampling without replacement).
 */
export function weightedOrder(ids: string[], weight: (id: string) => number, rng: Rng): string[] {
  return ids
    .map((id) => ({ id, key: Math.log(Math.max(rng(), 1e-12)) / Math.max(weight(id), 1e-6) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.id);
}

/** Reads saved progress, ignoring anything unreadable. */
export function parseProgress(text: string | null): Progress {
  if (!text) return emptyProgress();
  try {
    const data = JSON.parse(text);
    if (data?.version !== 1 || typeof data.cards !== 'object' || !Array.isArray(data.days)) return emptyProgress();
    return data as Progress;
  } catch {
    return emptyProgress();
  }
}
