import { describe, expect, it } from '@jest/globals';
import { PlayingCard, Rank, SUITS, Suit, seededRng } from '../cards';
import {
  AmaturufuState,
  PlayerCount,
  TeamMode,
  amaturufuCards,
  beats,
  collectTrick,
  deal,
  playCard,
  points,
  teamScores,
  teamsFor,
  trickWinner,
  winningTeams,
} from '../amaturufu';
import { chooseCard } from '../amaturufuBot';

const ALL_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const CODE: Record<Suit, string> = { spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D' };

const card = (rank: Rank, suit: Suit): PlayingCard => ({ id: `t-${rank}${CODE[suit]}`, rank, suit });
const fullDeck = (): PlayingCard[] => SUITS.flatMap((s) => ALL_RANKS.map((r) => card(r, s)));

function playOut(state: AmaturufuState): AmaturufuState {
  let s = state;
  let guard = 0;
  while (s.phase !== 'finished') {
    if (guard++ > 1000) throw new Error('game did not finish');
    s = s.phase === 'trickComplete' ? collectTrick(s) : playCard(s, s.turn, chooseCard(s, s.turn).id);
  }
  return s;
}

describe('deck', () => {
  it('removes 2, 8, 9, 10: 36 cards worth 120 points', () => {
    const cards = amaturufuCards(fullDeck());
    expect(cards).toHaveLength(36);
    expect(cards.reduce((sum, c) => sum + points(c), 0)).toBe(120);
    expect(cards.some((c) => ['2', '8', '9', '10'].includes(c.rank))).toBe(false);
  });
});

describe('who wins a trick', () => {
  // Author's example: trump is spades, a 6 of diamonds is led.
  const trump: Suit = 'spades';
  const led = card('6', 'diamonds');

  it('beats lower cards of the led suit', () => {
    for (const r of ['3', '4', '5'] as Rank[]) expect(beats(card(r, 'diamonds'), led, trump)).toBe(false);
  });
  it('beats any club or heart', () => {
    expect(beats(card('A', 'clubs'), led, trump)).toBe(false);
    expect(beats(card('A', 'hearts'), led, trump)).toBe(false);
  });
  it('loses to a higher diamond and to any spade', () => {
    expect(beats(card('Q', 'diamonds'), led, trump)).toBe(true);
    expect(beats(card('3', 'spades'), led, trump)).toBe(true);
  });
  it('ranks 3 4 5 6 Q J K 7 A', () => {
    const order: Rank[] = ['3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
    for (let i = 1; i < order.length; i++) {
      expect(beats(card(order[i], 'hearts'), card(order[i - 1], 'hearts'), trump)).toBe(true);
      expect(beats(card(order[i - 1], 'hearts'), card(order[i], 'hearts'), trump)).toBe(false);
    }
  });
  it('queen loses to jack', () => {
    expect(beats(card('J', 'clubs'), card('Q', 'clubs'), trump)).toBe(true);
  });
  it('highest trump wins over a higher led card', () => {
    const w = trickWinner(
      [
        { seat: 0, card: card('A', 'hearts') },
        { seat: 1, card: card('4', 'spades') },
        { seat: 2, card: card('Q', 'spades') },
        { seat: 3, card: card('7', 'hearts') },
      ],
      trump,
    );
    expect(w.seat).toBe(2);
  });
});

describe('dealing', () => {
  it('gives 3 cards each, trump card at the bottom, left of dealer leads', () => {
    for (const n of [2, 4, 6] as const) {
      const s = deal(fullDeck(), n, 'solo', 0, seededRng(n));
      expect(s.hands.every((h) => h.length === 3)).toBe(true);
      expect(s.stock[s.stock.length - 1]).toEqual(s.trumpCard);
      expect(s.trumpSuit).toBe(s.trumpCard.suit);
      expect(s.stock.length + 3 * n).toBe(36);
      expect(s.turn).toBe(1);
    }
  });
  it('teams: 4 players partners opposite; 6 players either mode', () => {
    expect(teamsFor(2, 'solo')).toEqual([0, 1]);
    expect(teamsFor(4, 'solo')).toEqual([0, 1, 0, 1]);
    expect(teamsFor(6, 'teams')).toEqual([0, 1, 0, 1, 0, 1]);
    expect(teamsFor(6, 'solo')).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('playing', () => {
  it('lets a player play any card, even holding the led suit', () => {
    const s = deal(fullDeck(), 2, 'solo', 0, seededRng(7));
    const leader = s.turn;
    const lead = s.hands[leader][0];
    const after = playCard(s, leader, lead.id);
    const other = after.turn;
    for (const c of after.hands[other]) expect(() => playCard(after, other, c.id)).not.toThrow();
  });
  it('rejects playing out of turn or a card not held', () => {
    const s = deal(fullDeck(), 2, 'solo', 0, seededRng(3));
    const other = (s.turn + 1) % 2;
    expect(() => playCard(s, other, s.hands[other][0].id)).toThrow();
    expect(() => playCard(s, s.turn, s.hands[other][0].id)).toThrow();
  });
  it('winner takes the trick, draws first and leads next', () => {
    let s = deal(fullDeck(), 4, 'teams', 0, seededRng(11));
    while (s.phase === 'playing') s = playCard(s, s.turn, s.hands[s.turn][0].id);
    const winner = trickWinner(s.trick, s.trumpSuit).seat;
    const next = s.stock.slice(0, 4);
    s = collectTrick(s);
    expect(s.turn).toBe(winner);
    expect(s.won[winner]).toHaveLength(4);
    for (let i = 0; i < 4; i++) expect(s.hands[(winner + i) % 4]).toContainEqual(next[i]);
    expect(s.hands.every((h) => h.length === 3)).toBe(true);
  });
  it('trump card is the last card drawn', () => {
    let s = deal(fullDeck(), 2, 'solo', 0, seededRng(5));
    const trumpCard = s.trumpCard;
    while (s.stock.length > 0) {
      s = s.phase === 'trickComplete' ? collectTrick(s) : playCard(s, s.turn, s.hands[s.turn][0].id);
      if (s.stock.length > 0) expect(s.stock[s.stock.length - 1]).toEqual(trumpCard);
    }
    expect(s.hands.flat()).toContainEqual(trumpCard);
  });
});

describe('full games', () => {
  const setups: [PlayerCount, TeamMode][] = [
    [2, 'solo'],
    [4, 'teams'],
    [6, 'teams'],
    [6, 'solo'],
  ];
  it.each(setups)('%i players (%s): every card played once, 120 points total', (n, mode) => {
    for (let seed = 1; seed <= 25; seed++) {
      const end = playOut(deal(fullDeck(), n, mode, seed % n, seededRng(seed)));
      expect(end.won.flat()).toHaveLength(36);
      expect(new Set(end.won.flat().map((c) => c.id)).size).toBe(36);
      expect(teamScores(end).reduce((a, b) => a + b, 0)).toBe(120);
      expect(winningTeams(end).length).toBeGreaterThan(0);
    }
  });
  it('a 60-60 split is a draw', () => {
    const s = deal(fullDeck(), 2, 'solo', 0, seededRng(1));
    const deck = amaturufuCards(fullDeck());
    const half = (suits: Suit[]) => deck.filter((c) => suits.includes(c.suit));
    const tied: AmaturufuState = { ...s, won: [half(['spades', 'hearts']), half(['clubs', 'diamonds'])] };
    expect(teamScores(tied)).toEqual([60, 60]);
    expect(winningTeams(tied)).toEqual([0, 1]);
  });
});

describe('computer player', () => {
  it('only ever chooses a card from its own hand', () => {
    let s = deal(fullDeck(), 6, 'solo', 2, seededRng(99));
    while (s.phase !== 'finished') {
      if (s.phase === 'trickComplete') s = collectTrick(s);
      else {
        const c = chooseCard(s, s.turn);
        expect(s.hands[s.turn]).toContainEqual(c);
        s = playCard(s, s.turn, c.id);
      }
    }
  });
  it('wins the board cheaply when an ace is on the table and it plays last', () => {
    const s = deal(fullDeck(), 2, 'solo', 0, seededRng(1));
    const trump = s.trumpSuit;
    const side = (['spades', 'hearts', 'clubs', 'diamonds'] as Suit[]).find((x) => x !== trump)!;
    const third = (['spades', 'hearts', 'clubs', 'diamonds'] as Suit[]).find((x) => x !== trump && x !== side)!;
    const state: AmaturufuState = {
      ...s,
      hands: [[], [card('3', trump), card('A', trump), card('4', third)]],
      trick: [{ seat: 0, card: card('A', side) }],
      turn: 1,
    };
    expect(chooseCard(state, 1)).toEqual(card('3', trump));
  });
});
