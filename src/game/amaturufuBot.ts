/**
 * A simple computer player for Amaturufu. It sees only what a person in its
 * seat would: its own hand, the cards on the table and the trump card.
 */

import { PlayingCard } from './cards';
import { AmaturufuState, beats, points, rankIndex, trickWinner } from './amaturufu';

/** How much a card is worth keeping: points first, then trump, then rank. */
function keepValue(card: PlayingCard, state: AmaturufuState): number {
  const trump = card.suit === state.trumpSuit ? 50 : 0;
  return points(card) * 10 + trump + rankIndex(card.rank);
}

function cheapest(cards: PlayingCard[], state: AmaturufuState): PlayingCard {
  return cards.reduce((a, b) => (keepValue(b, state) < keepValue(a, state) ? b : a));
}

export function chooseCard(state: AmaturufuState, seat: number): PlayingCard {
  const hand = state.hands[seat];
  if (hand.length === 1 || state.trick.length === 0) return cheapest(hand, state);

  const best = trickWinner(state.trick, state.trumpSuit);
  const partnerWinning = best.seat !== seat && state.teams[best.seat] === state.teams[seat];
  const lastToPlay = state.trick.length === state.playerCount - 1;
  const onTable = state.trick.reduce((sum, p) => sum + points(p.card), 0);

  if (partnerWinning) {
    // Feed points to a partner who is sure to win; otherwise stay cheap.
    if (lastToPlay) {
      const nonTrump = hand.filter((c) => c.suit !== state.trumpSuit);
      if (nonTrump.length) return nonTrump.reduce((a, b) => (points(b) > points(a) ? b : a));
    }
    return cheapest(hand, state);
  }

  const winners = hand.filter((c) => beats(c, best.card, state.trumpSuit));
  if (winners.length) {
    const winner = cheapest(winners, state);
    const cost = points(winner) + (winner.suit === state.trumpSuit ? 4 : 0);
    // Take the trick when it is worth what it costs, or when it's free.
    if (onTable > 0 && (lastToPlay || onTable >= cost)) return winner;
    if (cost === 0 && winner.suit !== state.trumpSuit) return winner;
  }
  return cheapest(hand, state);
}
