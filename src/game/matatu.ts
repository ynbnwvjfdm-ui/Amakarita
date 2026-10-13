/**
 * Matatu, the East African shedding game, as played by the deck's author.
 *
 * Basics
 * - 2 to 6 players, one deck with both jokers, 4 to 7 cards each.
 * - After dealing, a card is turned face up under the pile. It cannot be a
 *   special card or a 7. Its suit is the cut suit.
 * - The player left of the dealer starts with any card. After that a card
 *   must match the suit or the number of the top card.
 * - Instead of playing you may pick one card ("pick and play"): you may play
 *   it at once, otherwise your turn ends.
 * - Nothing tells a person which card fits, as at a real table. A card that
 *   doesn't fit goes back to the hand along with a penalty card; after a
 *   pick, a wrong card also ends the turn.
 * - When the pile runs out, the played cards except the top one are shuffled
 *   into a new pile.
 *
 * Special cards
 * - Ace: goes on anything; the player chooses the next suit.
 * - Ace of spades: also cancels any pick-up aimed at the player.
 * - Jack: reverses direction. 8: skips the next player. With two players
 *   both give the same player another turn.
 * - Queen: the same player must add a card of the Queen's suit, or pick one
 *   card (and play it if it is of that suit).
 * - 2, 3 and Joker are pick-ups worth 2, 3 and 6. The dark joker goes on
 *   black cards, the coloured joker on red cards.
 * - Facing a pick-up you answer with a 2, 3 or Joker, play the ace of spades,
 *   or pick up the total. An answer the same as or bigger than the last
 *   pick-up card adds to the total and passes it on; a smaller one makes you
 *   pick up the total minus your card, and your turn ends.
 * - The 7 of the cut suit lets its player end the round (they may decline).
 *
 * Rounds
 * - A player whose turn ends with no cards is out of the round (safe). If a
 *   card gives them another turn, they must pick instead.
 * - The round ends when one player still holds cards: that player is out of
 *   the match. If the round is cut, everyone counts the points in hand and
 *   the highest total is out of the match (ties: more cards, then the first
 *   such player after the cutter).
 * - Rounds repeat with the remaining players until one is left: the winner.
 */

import { Rank, Rng, Suit, shuffle } from './cards';

export type MatatuRank = Rank | 'joker';
export type Color = 'black' | 'red';

export interface MatatuCard {
  id: string;
  rank: MatatuRank;
  /** null for jokers. */
  suit: Suit | null;
  color: Color;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const HAND_SIZES = [4, 5, 6, 7] as const;
export const WARNING_PENALTY = 2;
export const WRONG_CARD_PENALTY = 1;

const PICKUP_VALUE: Partial<Record<MatatuRank, number>> = { '2': 2, '3': 3, joker: 6 };
const CUT_CARD_RANKS: MatatuRank[] = ['4', '5', '6', '9', '10', 'K'];
const POINTS: Record<MatatuRank, number> = {
  '2': 20, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13, A: 15, joker: 50,
};

export function suitColor(suit: Suit): Color {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function cardPoints(card: MatatuCard): number {
  if (card.rank === 'A' && card.suit === 'spades') return 60;
  return POINTS[card.rank];
}

export function handPoints(hand: MatatuCard[]): number {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0);
}

export function pickupValue(card: MatatuCard): number {
  return PICKUP_VALUE[card.rank] ?? 0;
}

const isAceOfSpades = (c: MatatuCard) => c.rank === 'A' && c.suit === 'spades';

export interface RoundResult {
  /** The seat knocked out of the match. */
  out: number;
  reason: 'lastWithCards' | 'cut';
  /** Points in each seat's hand when the round was cut. */
  points?: number[];
  cutter?: number;
}

export type Phase =
  | 'play' // `turn` plays a card or picks
  | 'chooseSuit' // `turn` just played an ace
  | 'confirmCut' // `turn` just played the 7 of the cut suit
  | 'queen' // `turn` must add a card of `queenSuit` or pick
  | 'drawn' // `turn` picked `drawn`, which fits: play it or keep it
  | 'roundOver'
  | 'matchOver';

export interface MatatuState {
  playerCount: number;
  handSize: number;
  /** Still in the match. */
  inMatch: boolean[];
  /** Still holding cards in this round. */
  inRound: boolean[];
  hands: MatatuCard[][];
  /** Draw pile, next card first. */
  stock: MatatuCard[];
  /** Played cards, top card last. */
  discard: MatatuCard[];
  cutCard: MatatuCard;
  cutSuit: Suit;
  /** Suit to follow; null before the first card. Set by the last suited card or an ace's choice. */
  activeSuit: Suit | null;
  turn: number;
  direction: 1 | -1;
  dealer: number;
  pickup: { total: number; last: number } | null;
  phase: Phase;
  queenSuit: Suit | null;
  drawn: MatatuCard | null;
  /** Seats that emptied their hand this round, in order. */
  finished: number[];
  round: number;
  roundResult: RoundResult | null;
  /** Seats in the order they were knocked out of the match. */
  knockedOut: number[];
}

/** The cards Matatu uses: 52 suited cards plus the two jokers (dark first). */
export function matatuDeck(
  suited: { id: string; rank: Rank; suit: Suit }[],
  jokerIds: [dark: string, coloured: string],
): MatatuCard[] {
  return [
    ...suited.map((c) => ({ ...c, color: suitColor(c.suit) })),
    { id: jokerIds[0], rank: 'joker' as const, suit: null, color: 'black' as const },
    { id: jokerIds[1], rank: 'joker' as const, suit: null, color: 'red' as const },
  ];
}

function nextSeat(state: Pick<MatatuState, 'playerCount' | 'inRound' | 'direction'>, from: number, steps = 1): number {
  let seat = from;
  for (let i = 0; i < steps; i++) {
    do {
      seat = (seat + state.direction + state.playerCount) % state.playerCount;
    } while (!state.inRound[seat] && seat !== from);
  }
  return seat;
}

function playersInRound(state: MatatuState): number {
  return state.inRound.filter(Boolean).length;
}

export function newMatch(cards: MatatuCard[], playerCount: number, handSize: number, dealer: number, rng: Rng): MatatuState {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) throw new Error(`Matatu is for 2–6 players`);
  const inMatch = Array.from({ length: playerCount }, () => true);
  return dealRound(cards, playerCount, handSize, inMatch, dealer, 1, [], rng);
}

function dealRound(
  cards: MatatuCard[],
  playerCount: number,
  handSize: number,
  inMatch: boolean[],
  dealer: number,
  round: number,
  knockedOut: number[],
  rng: Rng,
): MatatuState {
  const stock = shuffle(cards, rng);
  const hands: MatatuCard[][] = Array.from({ length: playerCount }, () => []);
  const order: number[] = [];
  for (let i = 1; i <= playerCount; i++) {
    const s = (dealer + i) % playerCount;
    if (inMatch[s]) order.push(s);
  }
  for (let r = 0; r < handSize; r++) for (const s of order) hands[s].push(stock.shift()!);

  // Turn the first eligible card face up under the pile.
  const cutIndex = stock.findIndex((c) => CUT_CARD_RANKS.includes(c.rank));
  const [cutCard] = stock.splice(cutIndex, 1);
  stock.push(cutCard);

  return {
    playerCount,
    handSize,
    inMatch: inMatch.slice(),
    inRound: inMatch.slice(),
    hands,
    stock,
    discard: [],
    cutCard,
    cutSuit: cutCard.suit!,
    activeSuit: null,
    turn: order[0],
    direction: 1,
    dealer,
    pickup: null,
    phase: 'play',
    queenSuit: null,
    drawn: null,
    finished: [],
    round,
    roundResult: null,
    knockedOut,
  };
}

export function nextRound(state: MatatuState, cards: MatatuCard[], rng: Rng): MatatuState {
  if (state.phase !== 'roundOver') throw new Error('Round is not over');
  let dealer = state.dealer;
  do dealer = (dealer + 1) % state.playerCount;
  while (!state.inMatch[dealer]);
  return dealRound(cards, state.playerCount, state.handSize, state.inMatch, dealer, state.round + 1, state.knockedOut, rng);
}

export function topCard(state: MatatuState): MatatuCard | null {
  return state.discard.length ? state.discard[state.discard.length - 1] : null;
}

/** Can `card` be played by the player whose turn it is? */
export function canPlay(state: MatatuState, card: MatatuCard): boolean {
  if (state.phase === 'drawn') return card.id === state.drawn?.id && fits(state, card);
  if (state.phase === 'play' || state.phase === 'queen') return fits(state, card);
  return false;
}

function fits(state: MatatuState, card: MatatuCard): boolean {
  // After a queen (including a card picked after it) only her suit will do.
  if (state.queenSuit) return card.suit === state.queenSuit;
  const top = topCard(state);
  const jokerFits = state.activeSuit === null || card.color === suitColor(state.activeSuit);
  if (state.pickup) {
    if (isAceOfSpades(card)) return true;
    if (card.rank === 'joker') return jokerFits;
    return card.rank === '2' || card.rank === '3';
  }
  if (!top) return true;
  if (card.rank === 'A') return true;
  if (card.rank === 'joker') return jokerFits;
  if (card.suit === state.activeSuit) return true;
  return top.rank !== 'joker' && card.rank === top.rank;
}

export function playableCards(state: MatatuState, seat: number): MatatuCard[] {
  if (seat !== state.turn) return [];
  return state.hands[seat].filter((c) => canPlay(state, c));
}

/** Take n cards from the pile, reshuffling played cards in when it runs out. */
function takeCards(state: MatatuState, seat: number, n: number, rng: Rng): MatatuState {
  let stock = state.stock.slice();
  let discard = state.discard;
  const taken: MatatuCard[] = [];
  for (let i = 0; i < n; i++) {
    if (stock.length === 0 && discard.length > 1) {
      stock = shuffle(discard.slice(0, -1), rng);
      discard = discard.slice(-1);
    }
    if (stock.length === 0) break;
    taken.push(stock.shift()!);
  }
  const hands = state.hands.map((h, s) => (s === seat ? [...h, ...taken] : h));
  return { ...state, stock, discard, hands };
}

/** End the current player's turn, handing over to `next` (or ending the round). */
function endTurn(state: MatatuState, next?: number): MatatuState {
  const seat = state.turn;
  let s: MatatuState = { ...state, phase: 'play', queenSuit: null, drawn: null };
  if (s.hands[seat].length === 0 && s.inRound[seat]) {
    s = { ...s, inRound: s.inRound.map((v, i) => (i === seat ? false : v)), finished: [...s.finished, seat] };
    if (playersInRound(s) === 1) {
      const out = s.inRound.findIndex(Boolean);
      return knockOut(s, { out, reason: 'lastWithCards' });
    }
  }
  return { ...s, turn: next ?? nextSeat(s, seat) };
}

function knockOut(state: MatatuState, result: RoundResult): MatatuState {
  const inMatch = state.inMatch.map((v, i) => (i === result.out ? false : v));
  const left = inMatch.filter(Boolean).length;
  return {
    ...state,
    inMatch,
    roundResult: result,
    knockedOut: [...state.knockedOut, result.out],
    phase: left === 1 ? 'matchOver' : 'roundOver',
    pickup: null,
  };
}

export function matchWinner(state: MatatuState): number | null {
  return state.phase === 'matchOver' ? state.inMatch.findIndex(Boolean) : null;
}

export function playCard(state: MatatuState, seat: number, cardId: string, rng: Rng): MatatuState {
  if (seat !== state.turn) throw new Error(`Not seat ${seat}'s turn`);
  const card = state.hands[seat].find((c) => c.id === cardId);
  if (!card) throw new Error(`Seat ${seat} does not hold ${cardId}`);
  if (!canPlay(state, card)) throw new Error(`${cardId} cannot be played now`);

  const facing = state.pickup;
  let s: MatatuState = {
    ...state,
    hands: state.hands.map((h, i) => (i === seat ? h.filter((c) => c.id !== cardId) : h)),
    discard: [...state.discard, card],
    activeSuit: card.suit ?? state.activeSuit,
    phase: 'play',
    queenSuit: null,
    drawn: null,
  };
  const twoPlayers = playersInRound(s) === 2;

  // Answering (or starting) a pick-up.
  const value = pickupValue(card);
  if (value > 0) {
    if (facing && value < facing.last) {
      s = takeCards({ ...s, pickup: null }, seat, facing.total - value, rng);
      return endTurn(s);
    }
    s = { ...s, pickup: { total: (facing?.total ?? 0) + value, last: value } };
    return endTurn(s);
  }

  if (card.rank === 'A') {
    return { ...s, pickup: isAceOfSpades(card) ? null : s.pickup, phase: 'chooseSuit' };
  }
  if (card.rank === '7' && card.suit === state.cutSuit) {
    return { ...s, phase: 'confirmCut' };
  }
  return afterEffect(s, card, twoPlayers, rng);
}

/** Effects of jack, 8 and queen; anything else simply ends the turn. */
function afterEffect(s: MatatuState, card: MatatuCard, twoPlayers: boolean, rng: Rng): MatatuState {
  const seat = s.turn;
  if (card.rank === 'Q') {
    return mustContinue({ ...s, phase: 'queen', queenSuit: card.suit }, rng);
  }
  if (card.rank === 'J') {
    if (twoPlayers) return mustContinue(s, rng);
    const reversed: MatatuState = { ...s, direction: s.direction === 1 ? -1 : 1 };
    return endTurn(reversed, nextSeat(reversed, seat));
  }
  if (card.rank === '8') {
    if (twoPlayers) return mustContinue(s, rng);
    return endTurn(s, nextSeat(s, seat, 2));
  }
  return endTurn(s);
}

/** The same player goes again. With an empty hand they must pick. */
function mustContinue(s: MatatuState, rng: Rng): MatatuState {
  if (s.hands[s.turn].length > 0) return s;
  return drawCard(s, s.turn, rng);
}

export function chooseSuit(state: MatatuState, seat: number, suit: Suit): MatatuState {
  if (state.phase !== 'chooseSuit' || seat !== state.turn) throw new Error('Not choosing a suit');
  return endTurn({ ...state, activeSuit: suit });
}

export function confirmCut(state: MatatuState, seat: number, endRound: boolean): MatatuState {
  if (state.phase !== 'confirmCut' || seat !== state.turn) throw new Error('No cut to confirm');
  if (!endRound) return endTurn({ ...state, phase: 'play' });

  const points = state.hands.map((h, i) => (state.inRound[i] ? handPoints(h) : 0));
  // Highest points is out; ties go to more cards, then the first after the cutter.
  let out = -1;
  for (let i = 1; i <= state.playerCount; i++) {
    const s = (seat + i * state.direction + state.playerCount * 2) % state.playerCount;
    if (!state.inRound[s]) continue;
    if (
      out === -1 ||
      points[s] > points[out] ||
      (points[s] === points[out] && state.hands[s].length > state.hands[out].length)
    ) {
      out = s;
    }
  }
  return knockOut(state, { out, reason: 'cut', points, cutter: seat });
}

/**
 * Pick from the pile. Facing a pick-up: take the whole total and the turn
 * ends. Otherwise take one card, which the player may then play or keep.
 */
export function drawCard(state: MatatuState, seat: number, rng: Rng): MatatuState {
  if (seat !== state.turn) throw new Error(`Not seat ${seat}'s turn`);
  if (state.phase !== 'play' && state.phase !== 'queen') throw new Error(`Cannot pick during ${state.phase}`);

  if (state.pickup && state.phase === 'play') {
    const s = takeCards({ ...state, pickup: null }, seat, state.pickup.total, rng);
    return endTurn(s);
  }
  const s = takeCards(state, seat, 1, rng);
  const got = s.hands[seat].length > state.hands[seat].length ? s.hands[seat][s.hands[seat].length - 1] : null;
  if (got) return { ...s, phase: 'drawn', drawn: got };
  return endTurn(s);
}

/**
 * A person puts a card down. If it fits it is played; if not it stays in the
 * hand and the player takes a penalty card (and, after a pick, the turn ends).
 */
export function putDown(state: MatatuState, seat: number, cardId: string, rng: Rng): { state: MatatuState; wrong: boolean } {
  if (seat !== state.turn) throw new Error(`Not seat ${seat}'s turn`);
  const card = state.hands[seat].find((c) => c.id === cardId);
  if (!card) throw new Error(`Seat ${seat} does not hold ${cardId}`);
  if (canPlay(state, card)) return { state: playCard(state, seat, cardId, rng), wrong: false };
  const fined = takeCards(state, seat, WRONG_CARD_PENALTY, rng);
  return { state: state.phase === 'drawn' ? endTurn(fined) : fined, wrong: true };
}

/** After picking a card: keep it instead of playing it. */
export function keepDrawn(state: MatatuState, seat: number): MatatuState {
  if (state.phase !== 'drawn' || seat !== state.turn) throw new Error('No picked card to keep');
  return endTurn(state);
}

/** Penalty for a player caught not announcing their last cards. */
export function penalize(state: MatatuState, seat: number, rng: Rng): MatatuState {
  if (state.phase === 'roundOver' || state.phase === 'matchOver' || !state.inRound[seat]) return state;
  return takeCards(state, seat, WARNING_PENALTY, rng);
}
