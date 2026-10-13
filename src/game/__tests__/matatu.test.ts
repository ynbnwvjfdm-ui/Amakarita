import { describe, expect, it } from '@jest/globals';
import { Rank, SUITS, Suit, seededRng } from '../cards';
import {
  MatatuCard,
  MatatuState,
  canPlay,
  chooseSuit,
  confirmCut,
  drawCard,
  handPoints,
  keepDrawn,
  matatuDeck,
  matchWinner,
  newMatch,
  nextRound,
  penalize,
  playCard,
  putDown,
  suitColor,
} from '../matatu';
import { botAction } from '../matatuBot';

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const CODE: Record<Suit, string> = { spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D' };
const rng = seededRng(42);

const deck = (): MatatuCard[] =>
  matatuDeck(
    SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `t-${rank}${CODE[suit]}`, rank, suit }))),
    ['t-joker1', 't-joker2'],
  );
const c = (rank: Rank, suit: Suit): MatatuCard => ({ id: `t-${rank}${CODE[suit]}`, rank, suit, color: suitColor(suit) });
const blackJoker: MatatuCard = { id: 't-joker1', rank: 'joker', suit: null, color: 'black' };
const redJoker: MatatuCard = { id: 't-joker2', rank: 'joker', suit: null, color: 'red' };
const filler = (n: number, suit: Suit = 'clubs'): MatatuCard[] =>
  (['4', '5', '6', '9', '10', 'K'] as Rank[]).slice(0, n).map((r) => c(r, suit));

/** A table with chosen hands and top card; the stock is the rest of the deck. */
function table(hands: MatatuCard[][], top: MatatuCard | null, extra: Partial<MatatuState> = {}): MatatuState {
  const base = newMatch(deck(), hands.length, 5, hands.length - 1, seededRng(1));
  const used = new Set([...hands.flat(), ...(top ? [top] : [])].map((x) => x.id));
  const cut = c('5', 'diamonds');
  const stock = deck().filter((x) => !used.has(x.id) && x.id !== cut.id);
  return {
    ...base,
    hands,
    discard: top ? [top] : [],
    activeSuit: top?.suit ?? null,
    stock: used.has(cut.id) ? stock : [...stock, cut],
    cutCard: cut,
    cutSuit: 'diamonds',
    turn: 0,
    ...extra,
  };
}

const play = (s: MatatuState, card: MatatuCard) => playCard(s, s.turn, card.id, rng);
const totalCards = (s: MatatuState) => s.hands.flat().length + s.stock.length + s.discard.length;

describe('dealing', () => {
  it('uses 54 cards with both jokers', () => {
    expect(deck()).toHaveLength(54);
    expect(deck().filter((x) => x.rank === 'joker').map((x) => x.color)).toEqual(['black', 'red']);
  });
  it.each([2, 3, 4, 5, 6])('%i players: hands dealt, cut card under the pile, left of dealer starts', (n) => {
    for (const size of [4, 7]) {
      const s = newMatch(deck(), n, size, 0, seededRng(n * size));
      expect(s.hands.every((h) => h.length === size)).toBe(true);
      expect(s.stock[s.stock.length - 1]).toBe(s.cutCard);
      expect(['4', '5', '6', '9', '10', 'K']).toContain(s.cutCard.rank);
      expect(s.cutSuit).toBe(s.cutCard.suit);
      expect(s.turn).toBe(1 % n);
      expect(totalCards(s)).toBe(54);
    }
  });
  it('refuses 1 or 7 players', () => {
    expect(() => newMatch(deck(), 1, 5, 0, rng)).toThrow();
    expect(() => newMatch(deck(), 7, 5, 0, rng)).toThrow();
  });
});

describe('matching', () => {
  const s = table([filler(2), filler(2, 'hearts')], c('9', 'spades'));
  it('first card can be anything', () => {
    const first = table([filler(2), filler(2)], null);
    expect(canPlay(first, c('K', 'hearts'))).toBe(true);
  });
  it('same suit or same number', () => {
    expect(canPlay(s, c('4', 'spades'))).toBe(true);
    expect(canPlay(s, c('9', 'hearts'))).toBe(true);
    expect(canPlay(s, c('4', 'hearts'))).toBe(false);
  });
  it('aces go on anything', () => {
    expect(canPlay(s, c('A', 'hearts'))).toBe(true);
  });
  it('dark joker on black cards, coloured joker on red cards', () => {
    expect(canPlay(s, blackJoker)).toBe(true);
    expect(canPlay(s, redJoker)).toBe(false);
    const red = table([filler(2), filler(2)], c('9', 'hearts'));
    expect(canPlay(red, redJoker)).toBe(true);
    expect(canPlay(red, blackJoker)).toBe(false);
  });
});

describe('pick-ups (author examples, joker = 6)', () => {
  /** Players 0..n-1 answer in turn with the given cards, then the next player picks. */
  function chain(cards: MatatuCard[]) {
    const hands = cards.map((card) => [card, ...filler(3, 'hearts').map((x, i) => ({ ...x, id: `${x.id}-${card.id}-${i}` }))]);
    hands.push(filler(3));
    let s = table(hands, c('9', 'spades'));
    for (const card of cards) s = play(s, card);
    return s;
  }
  it('3 + 3: next picks 6', () => {
    expect(chain([c('3', 'spades'), c('3', 'hearts')]).pickup).toEqual({ total: 6, last: 3 });
  });
  it('2 + 2: next picks 4', () => {
    expect(chain([c('2', 'spades'), c('2', 'hearts')]).pickup).toEqual({ total: 4, last: 2 });
  });
  it('2 + 3: next picks 5', () => {
    expect(chain([c('2', 'spades'), c('3', 'spades')]).pickup).toEqual({ total: 5, last: 3 });
  });
  it('2, 2, 3: next picks 7', () => {
    expect(chain([c('2', 'spades'), c('2', 'hearts'), c('3', 'clubs')]).pickup).toEqual({ total: 7, last: 3 });
  });
  it('joker + joker: next picks 12', () => {
    let s = table([[blackJoker, ...filler(2)], [redJoker, ...filler(2, 'hearts')], filler(3, 'diamonds')], c('9', 'spades'));
    s = play(s, blackJoker);
    s = { ...s, activeSuit: 'hearts' }; // coloured joker needs a red suit to follow
    s = play(s, redJoker);
    expect(s.pickup).toEqual({ total: 12, last: 6 });
  });
  it('3, 3, joker: next picks 12', () => {
    expect(chain([c('3', 'spades'), c('3', 'clubs'), blackJoker]).pickup).toEqual({ total: 12, last: 6 });
  });
  it.each([
    [[c('3', 'spades'), c('2', 'spades')], 1],
    [[c('3', 'spades'), c('3', 'clubs'), c('2', 'clubs')], 4],
    [[blackJoker, c('3', 'spades')], 3],
    [[blackJoker, c('2', 'clubs')], 4],
  ])('a smaller answer picks the rest: %#', (cards, picks) => {
    const s = chain(cards);
    const answerer = cards.length - 1;
    expect(s.pickup).toBeNull();
    expect(s.hands[answerer]).toHaveLength(3 + picks);
    expect(s.turn).toBe(cards.length);
  });
  it('picking up takes the whole total and ends the turn', () => {
    let s = chain([c('3', 'spades'), c('3', 'hearts')]);
    const seat = s.turn;
    const before = s.hands[seat].length;
    s = drawCard(s, seat, rng);
    expect(s.hands[seat]).toHaveLength(before + 6);
    expect(s.pickup).toBeNull();
    expect(s.turn).not.toBe(seat);
  });
  it('only pick-up cards or the ace of spades answer a pick-up', () => {
    const s = chain([c('3', 'spades')]);
    expect(canPlay(s, c('3', 'hearts'))).toBe(true);
    expect(canPlay(s, c('2', 'diamonds'))).toBe(true);
    expect(canPlay(s, c('9', 'spades'))).toBe(false);
    expect(canPlay(s, c('A', 'hearts'))).toBe(false);
    expect(canPlay(s, c('A', 'spades'))).toBe(true);
  });
  it('ace of spades cancels the pick-up and chooses the suit', () => {
    let s = table([[c('3', 'spades'), ...filler(2)], [c('A', 'spades'), ...filler(2, 'hearts')], filler(3, 'diamonds')], c('9', 'spades'));
    s = play(s, c('3', 'spades'));
    s = play(s, c('A', 'spades'));
    expect(s.pickup).toBeNull();
    expect(s.phase).toBe('chooseSuit');
    s = chooseSuit(s, 1, 'diamonds');
    expect(s.activeSuit).toBe('diamonds');
    expect(s.turn).toBe(2);
    expect(s.hands[1]).toHaveLength(2);
  });
});

describe('special cards', () => {
  it('ace: player chooses the next suit', () => {
    let s = table([[c('A', 'hearts'), ...filler(2)], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c('A', 'hearts'));
    expect(s.phase).toBe('chooseSuit');
    s = chooseSuit(s, 0, 'clubs');
    expect(s.activeSuit).toBe('clubs');
    expect(canPlay(s, c('4', 'clubs'))).toBe(true);
    expect(canPlay(s, c('4', 'hearts'))).toBe(false);
  });
  it('jack reverses with 3+ players', () => {
    let s = table([[c('J', 'spades'), ...filler(2)], filler(3, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = play(s, c('J', 'spades'));
    expect(s.direction).toBe(-1);
    expect(s.turn).toBe(2);
  });
  it('8 skips the next player', () => {
    let s = table([[c('8', 'spades'), ...filler(2)], filler(3, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = play(s, c('8', 'spades'));
    expect(s.turn).toBe(2);
  });
  it.each(['J', '8'] as Rank[])('%s with 2 players: same player again', (rank) => {
    let s = table([[c(rank, 'spades'), ...filler(2)], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c(rank, 'spades'));
    expect(s.turn).toBe(0);
    expect(s.phase).toBe('play');
  });
  it.each(['J', '8'] as Rank[])('%s as last card with 2 players: must pick, not out', (rank) => {
    let s = table([[c(rank, 'spades')], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c(rank, 'spades'));
    expect(s.hands[0].length).toBeGreaterThan(0);
    expect(s.inRound[0]).toBe(true);
  });
  it('queen: add a card of her suit', () => {
    let s = table([[c('Q', 'spades'), c('4', 'spades'), c('4', 'hearts')], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c('Q', 'spades'));
    expect(s.phase).toBe('queen');
    expect(s.turn).toBe(0);
    expect(canPlay(s, c('4', 'hearts'))).toBe(false);
    s = play(s, c('4', 'spades'));
    expect(s.turn).toBe(1);
  });
  it('queen without her suit: pick one; play it only if it is her suit', () => {
    let s = table([[c('Q', 'spades'), c('4', 'hearts')], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c('Q', 'spades'));
    s = { ...s, stock: [c('5', 'hearts'), ...s.stock.filter((x) => x.id !== 't-5H')] };
    s = drawCard(s, 0, rng);
    expect(s.phase).toBe('drawn');
    expect(canPlay(s, c('5', 'hearts'))).toBe(false);
    s = keepDrawn(s, 0);
    expect(s.hands[0]).toHaveLength(2);
    expect(s.turn).toBe(1);

    let t = table([[c('Q', 'spades'), c('4', 'hearts')], filler(3, 'hearts')], c('9', 'spades'));
    t = play(t, c('Q', 'spades'));
    t = { ...t, stock: [c('5', 'spades'), ...t.stock.filter((x) => x.id !== 't-5S')] };
    t = drawCard(t, 0, rng);
    expect(t.phase).toBe('drawn');
    expect(canPlay(t, c('5', 'spades'))).toBe(true);
  });
});

describe('pick and play', () => {
  it('a picked card that fits can be played or kept', () => {
    let s = table([filler(2, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = { ...s, stock: [c('5', 'spades'), ...s.stock.filter((x) => x.id !== 't-5S')] };
    s = drawCard(s, 0, rng);
    expect(s.phase).toBe('drawn');
    const kept = keepDrawn(s, 0);
    expect(kept.turn).toBe(1);
    expect(kept.hands[0]).toHaveLength(3);
    const played = playCard(s, 0, 't-5S', rng);
    expect(played.hands[0]).toHaveLength(2);
    expect(played.turn).toBe(1);
  });
  it('a picked card is always offered, even when it does not fit (no hints)', () => {
    let s = table([filler(2, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = { ...s, stock: [c('5', 'hearts'), ...s.stock.filter((x) => x.id !== 't-5H')] };
    s = drawCard(s, 0, rng);
    expect(s.phase).toBe('drawn');
    expect(keepDrawn(s, 0).turn).toBe(1);
  });
  it('playing a picked card that does not fit: penalty card and the turn ends', () => {
    let s = table([filler(2, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = { ...s, stock: [c('5', 'hearts'), ...s.stock.filter((x) => x.id !== 't-5H')] };
    s = drawCard(s, 0, rng);
    const r = putDown(s, 0, 't-5H', rng);
    expect(r.wrong).toBe(true);
    expect(r.state.hands[0]).toHaveLength(4);
    expect(r.state.turn).toBe(1);
  });
  it('an empty pile is refilled from played cards, keeping the top card', () => {
    let s = table([filler(2, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    const played = [c('7', 'clubs'), c('8', 'clubs'), c('9', 'spades')];
    s = { ...s, stock: [], discard: played };
    s = drawCard(s, 0, rng);
    expect(s.discard).toEqual([c('9', 'spades')]);
    expect(s.hands[0].length + s.stock.length).toBe(4);
  });
});

describe('wrong cards', () => {
  it('a card that does not fit goes back with a penalty card; the turn goes on', () => {
    const s = table([[c('4', 'hearts'), c('5', 'spades')], filler(3, 'diamonds')], c('9', 'spades'));
    const r = putDown(s, 0, 't-4H', rng);
    expect(r.wrong).toBe(true);
    expect(r.state.hands[0].map((x) => x.id)).toContain('t-4H');
    expect(r.state.hands[0]).toHaveLength(3);
    expect(r.state.turn).toBe(0);
    expect(r.state.discard).toEqual(s.discard);
    const ok = putDown(r.state, 0, 't-5S', rng);
    expect(ok.wrong).toBe(false);
    expect(ok.state.turn).toBe(1);
  });
  it('facing a pick-up, a wrong card is fined and the pick-up still waits', () => {
    let s = table([[c('3', 'spades'), ...filler(2)], [c('9', 'hearts'), ...filler(2, 'hearts')], filler(3, 'diamonds')], c('9', 'spades'));
    s = playCard(s, 0, 't-3S', rng);
    const r = putDown(s, 1, 't-9H', rng);
    expect(r.wrong).toBe(true);
    expect(r.state.pickup).toEqual({ total: 3, last: 3 });
    expect(r.state.turn).toBe(1);
  });
});

describe('the cut', () => {
  it('7 of the cut suit asks; ending knocks out the highest points', () => {
    const cutter = [c('7', 'diamonds'), c('4', 'clubs')];
    const rich = [c('A', 'spades'), c('K', 'clubs')];
    const poor = [c('5', 'hearts'), c('6', 'hearts')];
    let s = table([cutter, rich, poor], c('9', 'diamonds'));
    s = play(s, c('7', 'diamonds'));
    expect(s.phase).toBe('confirmCut');
    const ended = confirmCut(s, 0, true);
    expect(ended.phase).toBe('roundOver');
    expect(ended.roundResult).toMatchObject({ out: 1, reason: 'cut', cutter: 0 });
    expect(ended.roundResult!.points).toEqual([4, 73, 11]);
    const declined = confirmCut(s, 0, false);
    expect(declined.phase).toBe('play');
    expect(declined.turn).toBe(1);
  });
  it('points: 3–10 face value, J 11, Q 12, K 13, A 15, 2 = 20, A♠ 60, joker 50', () => {
    expect(handPoints([c('3', 'clubs'), c('10', 'clubs'), c('J', 'clubs'), c('Q', 'clubs'), c('K', 'clubs')])).toBe(49);
    expect(handPoints([c('A', 'hearts'), c('2', 'hearts'), c('A', 'spades'), blackJoker])).toBe(145);
  });
});

describe('rounds and the match', () => {
  it('emptying your hand makes you safe; the last with cards is out', () => {
    let s = table([[c('4', 'spades')], filler(3, 'hearts')], c('9', 'spades'));
    s = play(s, c('4', 'spades'));
    expect(s.phase).toBe('matchOver');
    expect(s.roundResult).toMatchObject({ out: 1, reason: 'lastWithCards' });
    expect(matchWinner(s)).toBe(0);
  });
  it('with 3 players the round goes on after someone empties their hand', () => {
    let s = table([[c('4', 'spades')], filler(3, 'hearts'), filler(3, 'diamonds')], c('9', 'spades'));
    s = play(s, c('4', 'spades'));
    expect(s.phase).toBe('play');
    expect(s.inRound).toEqual([false, true, true]);
    expect(s.turn).toBe(1);
  });
  it('next round deals only to players still in the match', () => {
    let s = table([[c('7', 'diamonds')], [c('A', 'spades')], filler(2, 'hearts')], c('9', 'diamonds'));
    s = confirmCut(play(s, c('7', 'diamonds')), 0, true);
    expect(s.roundResult!.out).toBe(1);
    s = nextRound(s, deck(), seededRng(9));
    expect(s.hands[1]).toHaveLength(0);
    expect(s.inRound).toEqual([true, false, true]);
    expect(s.hands[0]).toHaveLength(5);
    expect(totalCards(s)).toBe(54);
  });
  it('penalty for not announcing: 2 cards', () => {
    const s = table([filler(2), filler(3, 'hearts')], c('9', 'spades'));
    expect(penalize(s, 0, rng).hands[0]).toHaveLength(4);
  });
});

describe('full matches with computer players', () => {
  it.each([2, 3, 4, 5, 6])('%i players: every match ends with one winner, no card lost', (n) => {
    for (let seed = 1; seed <= 15; seed++) {
      const r = seededRng(seed * 7 + n);
      let s = newMatch(deck(), n, 4 + (seed % 4), seed % n, r);
      let steps = 0;
      while (s.phase !== 'matchOver') {
        if (++steps > 20000) throw new Error(`stuck: ${s.phase}`);
        if (s.phase === 'roundOver') {
          s = nextRound(s, deck(), r);
          continue;
        }
        const a = botAction(s, s.turn);
        if (a.type === 'play') s = playCard(s, s.turn, a.cardId, r);
        else if (a.type === 'draw') s = drawCard(s, s.turn, r);
        else if (a.type === 'keep') s = keepDrawn(s, s.turn);
        else if (a.type === 'suit') s = chooseSuit(s, s.turn, a.suit);
        else s = confirmCut(s, s.turn, a.end);
        expect(totalCards(s)).toBe(54);
      }
      expect(s.knockedOut).toHaveLength(n - 1);
      expect(matchWinner(s)).not.toBeNull();
      expect(s.knockedOut).not.toContain(matchWinner(s));
    }
  });
});
