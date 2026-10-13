import { useCallback, useEffect, useState } from 'react';
import { AmaturufuState, Play, collectTrick, deal, playCard } from '../game/amaturufu';
import { chooseCard } from '../game/amaturufuBot';
import { PlayingCard } from '../game/cards';
import { playingCards } from '../decks';
import { AmaturufuConfig } from '../navigation';

/** Pauses, in milliseconds, so people can follow what happens. */
export const BOT_DELAY = 700;
export const SPOTLIGHT_MS = 1800;
export const TRICK_PAUSE = 1600;

/**
 * Runs one Amaturufu table: computer turns, the pause after each card while it
 * is shown large, the pause after each trick, and passing the phone between
 * people so nobody sees another person's cards.
 */
export function useAmaturufuTable(config: AmaturufuConfig) {
  const n = config.playerCount;
  const humans = config.seats.flatMap((s, i) => (s.kind === 'human' ? [i] : []));
  const shared = humans.length > 1;

  const newGame = useCallback(
    (dealer: number) => deal(playingCards(config.deckId), n, config.teamMode, dealer, Math.random),
    [config.deckId, n, config.teamMode],
  );

  const [game, setGame] = useState<AmaturufuState>(() => newGame(Math.floor(Math.random() * n)));
  const [spotlight, setSpotlight] = useState<Play | null>(null);
  // Whose cards are face up at the bottom. With one person it is always them;
  // when people share the phone it changes only after a hand-over.
  const [viewer, setViewer] = useState<number | null>(shared ? null : humans[0]);
  const [handoff, setHandoff] = useState<number | null>(null);

  const play = useCallback((seat: number, card: PlayingCard) => {
    setGame((g) => playCard(g, seat, card.id));
    setSpotlight({ seat, card });
  }, []);

  useEffect(() => {
    if (spotlight) {
      const id = setTimeout(() => setSpotlight(null), SPOTLIGHT_MS);
      return () => clearTimeout(id);
    }
    if (handoff !== null) return;
    if (game.phase === 'trickComplete') {
      const id = setTimeout(() => setGame(collectTrick), TRICK_PAUSE);
      return () => clearTimeout(id);
    }
    if (game.phase === 'playing') {
      const seat = game.turn;
      if (config.seats[seat].kind === 'bot') {
        const id = setTimeout(() => play(seat, chooseCard(game, seat)), BOT_DELAY);
        return () => clearTimeout(id);
      }
      if (seat !== viewer) setHandoff(seat);
    }
  }, [game, spotlight, handoff, viewer, config.seats, play]);

  const myTurn =
    viewer !== null && game.phase === 'playing' && game.turn === viewer && !spotlight && handoff === null;

  return {
    game,
    spotlight,
    viewer,
    handoff,
    myTurn,
    humans,
    /** Play a card from the hand on show; ignored unless it is that person's turn. */
    playMine: (card: PlayingCard) => {
      if (myTurn && viewer !== null) play(viewer, card);
    },
    dismissSpotlight: () => setSpotlight(null),
    acceptHandoff: () => {
      setViewer(handoff);
      setHandoff(null);
    },
    playAgain: () => {
      setGame((g) => newGame((g.dealer + 1) % n));
      setSpotlight(null);
      setHandoff(null);
      setViewer(shared ? null : humans[0]);
    },
  };
}
