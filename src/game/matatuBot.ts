/**
 * A simple computer player for Matatu. It sees its own hand, the played
 * cards and how many cards everyone holds, as a person at the table would.
 */

import { Suit, SUITS } from './cards';
import { MatatuCard, MatatuState, cardPoints, handPoints, pickupValue, playableCards } from './matatu';

export type BotAction =
  | { type: 'play'; cardId: string }
  | { type: 'draw' }
  | { type: 'keep' }
  | { type: 'suit'; suit: Suit }
  | { type: 'cut'; end: boolean };

/** Cut when the cards left in hand are worth this much or less. */
const CUT_AT = 25;

export function botAction(state: MatatuState, seat: number): BotAction {
  const hand = state.hands[seat];
  switch (state.phase) {
    case 'chooseSuit':
      return { type: 'suit', suit: favouriteSuit(hand) };
    case 'confirmCut':
      return { type: 'cut', end: handPoints(hand) <= CUT_AT };
    case 'drawn':
      return { type: 'play', cardId: state.drawn!.id };
    default: {
      const card = chooseCard(state, seat);
      return card ? { type: 'play', cardId: card.id } : { type: 'draw' };
    }
  }
}

function favouriteSuit(hand: MatatuCard[]): Suit {
  const count = (s: Suit) => hand.filter((c) => c.suit === s && c.rank !== 'A').length;
  return SUITS.reduce((best, s) => (count(s) > count(best) ? s : best));
}

function chooseCard(state: MatatuState, seat: number): MatatuCard | null {
  const options = playableCards(state, seat);
  if (!options.length) return null;
  const hand = state.hands[seat];

  if (state.pickup) {
    const { total, last } = state.pickup;
    const passOn = options.filter((c) => pickupValue(c) >= last);
    if (passOn.length) return cheapestKeep(passOn);
    const ace = options.find((c) => c.rank === 'A');
    if (ace && total >= 4) return ace;
    const smaller = options.filter((c) => pickupValue(c) > 0);
    if (smaller.length) return smaller.reduce((a, b) => (pickupValue(b) > pickupValue(a) ? b : a));
    return null;
  }

  const nextHand = smallestOpponentHand(state, seat);
  const score = (c: MatatuCard) => {
    let s = cardPoints(c); // shed costly cards first, in case of a cut
    if (c.rank === 'A') s -= c.suit === 'spades' ? 100 : 40; // keep aces for later
    if (c.rank === 'joker') s += nextHand <= 2 ? 40 : -30;
    if (pickupValue(c) > 0 && nextHand <= 2) s += 30;
    if (c.rank === 'Q') s += hand.some((o) => o.id !== c.id && o.suit === c.suit) ? 5 : -40;
    if (c.suit && c.suit !== 'spades') s += hand.filter((o) => o.suit === c.suit).length; // stay in long suits
    if (c.rank === '7' && c.suit === state.cutSuit) s += handPoints(hand) - cardPoints(c) <= CUT_AT ? 60 : -20;
    return s;
  };
  return options.reduce((a, b) => (score(b) > score(a) ? b : a));
}

function cheapestKeep(cards: MatatuCard[]): MatatuCard {
  // Pass the pick-up on with the card we mind losing least: plain 2s and 3s before jokers.
  return cards.reduce((a, b) => (pickupValue(b) < pickupValue(a) ? b : a));
}

function smallestOpponentHand(state: MatatuState, seat: number): number {
  const sizes = state.hands.flatMap((h, s) => (s !== seat && state.inRound[s] ? [h.length] : []));
  return sizes.length ? Math.min(...sizes) : 99;
}
