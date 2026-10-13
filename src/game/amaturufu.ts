/**
 * Amaturufu rules, as given by the deck's author:
 *
 * - 2, 4 or 6 players. 4 players always play in two teams (partners sit
 *   opposite); 6 players play either two teams of 3 or everyone alone.
 * - Remove the 2s, 8s, 9s, 10s and the jokers: 36 cards, 120 points.
 * - Deal 3 cards each. Turn the next card face up under the pile: its suit is
 *   trump for the whole game, and it is the last card drawn.
 * - The player left of the dealer leads. Any card may be played; there is no
 *   need to follow suit.
 * - A trick is won by the highest trump played, otherwise by the highest card
 *   of the suit that was led. Other suits never win.
 * - The winner takes the trick, draws first (then everyone else clockwise)
 *   and leads the next trick. When the pile is empty, play continues until
 *   every hand is empty.
 * - Rank, low to high: 3 4 5 6 Q J K 7 A.
 *   Points: Q=2, J=3, K=4, 7=10, A=11, others 0.
 * - Most points wins; equal points is a draw.
 *
 * Seats are numbered clockwise: seat (s + 1) % n is to the left of seat s.
 */

import { PlayingCard, Rank, Rng, Suit, shuffle } from './cards';

export const REMOVED_RANKS: Rank[] = ['2', '8', '9', '10'];
export const RANK_ORDER: Rank[] = ['3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
export const POINTS: Partial<Record<Rank, number>> = { Q: 2, J: 3, K: 4, '7': 10, A: 11 };
export const HAND_SIZE = 3;

export type PlayerCount = 2 | 4 | 6;
export type TeamMode = 'solo' | 'teams';

export interface Play {
  seat: number;
  card: PlayingCard;
}

export interface AmaturufuState {
  playerCount: PlayerCount;
  /** Team index for each seat. In solo games every seat is its own team. */
  teams: number[];
  dealer: number;
  /** The face-up card under the pile. */
  trumpCard: PlayingCard;
  trumpSuit: Suit;
  /** Draw pile, next card first. The trump card is the last element until drawn. */
  stock: PlayingCard[];
  hands: PlayingCard[][];
  trick: Play[];
  /** Seat whose turn it is (meaningless once finished). */
  turn: number;
  /** Cards each seat has won in tricks. */
  won: PlayingCard[][];
  lastTrick: { plays: Play[]; winner: number } | null;
  /** 'trickComplete': every seat has played; call collectTrick to continue. */
  phase: 'playing' | 'trickComplete' | 'finished';
}

export function points(card: PlayingCard): number {
  return POINTS[card.rank] ?? 0;
}

export function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

/** Does `a` beat the card currently winning the trick (`b`)? */
export function beats(a: PlayingCard, b: PlayingCard, trumpSuit: Suit): boolean {
  if (a.suit === b.suit) return rankIndex(a.rank) > rankIndex(b.rank);
  return a.suit === trumpSuit;
}

export function trickWinner(trick: Play[], trumpSuit: Suit): Play {
  return trick.reduce((best, p) => (beats(p.card, best.card, trumpSuit) ? p : best));
}

export function teamsFor(playerCount: PlayerCount, mode: TeamMode): number[] {
  if (playerCount === 4 || (playerCount === 6 && mode === 'teams')) {
    // Alternate seats: partners are never next to each other.
    return Array.from({ length: playerCount }, (_, s) => s % 2);
  }
  return Array.from({ length: playerCount }, (_, s) => s);
}

/** Keep only the cards used in Amaturufu (drops 2, 8, 9, 10 and jokers). */
export function amaturufuCards(cards: PlayingCard[]): PlayingCard[] {
  return cards.filter((c) => !REMOVED_RANKS.includes(c.rank));
}

export function deal(
  cards: PlayingCard[],
  playerCount: PlayerCount,
  teamMode: TeamMode,
  dealer: number,
  rng: Rng,
): AmaturufuState {
  const deck = shuffle(amaturufuCards(cards), rng);
  if (deck.length !== 36) throw new Error(`Amaturufu needs 36 cards, got ${deck.length}`);

  const hands: PlayingCard[][] = Array.from({ length: playerCount }, () => []);
  for (let round = 0; round < HAND_SIZE; round++) {
    for (let i = 1; i <= playerCount; i++) {
      hands[(dealer + i) % playerCount].push(deck.shift()!);
    }
  }
  const trumpCard = deck.shift()!;
  const first = (dealer + 1) % playerCount;

  return {
    playerCount,
    teams: teamsFor(playerCount, teamMode),
    dealer,
    trumpCard,
    trumpSuit: trumpCard.suit,
    stock: [...deck, trumpCard],
    hands,
    trick: [],
    turn: first,
    won: Array.from({ length: playerCount }, () => []),
    lastTrick: null,
    phase: 'playing',
  };
}

export function playCard(state: AmaturufuState, seat: number, cardId: string): AmaturufuState {
  if (state.phase !== 'playing') throw new Error(`Cannot play during ${state.phase}`);
  if (seat !== state.turn) throw new Error(`Not seat ${seat}'s turn`);
  const card = state.hands[seat].find((c) => c.id === cardId);
  if (!card) throw new Error(`Seat ${seat} does not hold ${cardId}`);

  const hands = state.hands.map((h, s) => (s === seat ? h.filter((c) => c.id !== cardId) : h));
  const trick = [...state.trick, { seat, card }];
  const complete = trick.length === state.playerCount;
  return {
    ...state,
    hands,
    trick,
    turn: complete ? state.turn : (seat + 1) % state.playerCount,
    phase: complete ? 'trickComplete' : 'playing',
  };
}

/** Give the finished trick to its winner, then everyone draws, winner first. */
export function collectTrick(state: AmaturufuState): AmaturufuState {
  if (state.phase !== 'trickComplete') throw new Error(`No complete trick (${state.phase})`);
  const winner = trickWinner(state.trick, state.trumpSuit).seat;

  const won = state.won.map((w, s) => (s === winner ? [...w, ...state.trick.map((p) => p.card)] : w));
  const stock = state.stock.slice();
  const hands = state.hands.map((h) => h.slice());
  if (stock.length >= state.playerCount) {
    for (let i = 0; i < state.playerCount; i++) {
      hands[(winner + i) % state.playerCount].push(stock.shift()!);
    }
  }

  const finished = hands.every((h) => h.length === 0);
  return {
    ...state,
    won,
    stock,
    hands,
    trick: [],
    turn: winner,
    lastTrick: { plays: state.trick, winner },
    phase: finished ? 'finished' : 'playing',
  };
}

/** Points per team (index = team number). */
export function teamScores(state: AmaturufuState): number[] {
  const count = Math.max(...state.teams) + 1;
  const scores = Array.from({ length: count }, () => 0);
  state.won.forEach((cards, seat) => {
    scores[state.teams[seat]] += cards.reduce((sum, c) => sum + points(c), 0);
  });
  return scores;
}

/** Winning team numbers; more than one means a draw between them. */
export function winningTeams(state: AmaturufuState): number[] {
  const scores = teamScores(state);
  const best = Math.max(...scores);
  return scores.flatMap((s, team) => (s === best ? [team] : []));
}
