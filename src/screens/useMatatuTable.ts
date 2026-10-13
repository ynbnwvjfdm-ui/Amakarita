import { useEffect, useMemo, useState } from 'react';
import {
  MatatuCard,
  MatatuState,
  chooseSuit,
  confirmCut,
  drawCard,
  keepDrawn,
  matatuDeck,
  newMatch,
  nextRound,
  penalize,
  playCard,
} from '../game/matatu';
import { botAction } from '../game/matatuBot';
import { Suit } from '../game/cards';
import { jokerIds, playingCards } from '../decks';
import { MatatuConfig } from '../navigation';

/** Pauses, in milliseconds, so people can follow what happens. */
export const BOT_DELAY = 800;
export const SPOTLIGHT_MS = 1400;
export const NOTICE_MS = 2200;
/** Time a person has to say "Warning!" / "One card!". Never shown on screen. */
export const ANNOUNCE_MS = 10_000;

export type Word = 'warning' | 'oneCard';
export type Notice = { kind: 'said'; seat: number; word: Word } | { kind: 'caught'; seat: number };

/**
 * Runs one Matatu table: computer turns, the pause while each played card is
 * shown large, passing the phone between people, and the hidden timer for
 * announcing the last two cards.
 */
export function useMatatuTable(config: MatatuConfig) {
  const n = config.seats.length;
  const humans = config.seats.flatMap((s, i) => (s.kind === 'human' ? [i] : []));
  const shared = humans.length > 1;
  const cards = useMemo(() => matatuDeck(playingCards(config.deckId), jokerIds(config.deckId)), [config.deckId]);

  const [game, setGame] = useState<MatatuState>(() =>
    newMatch(cards, n, config.handSize, Math.floor(Math.random() * n), Math.random),
  );
  const [spotlight, setSpotlight] = useState<{ seat: number; card: MatatuCard } | null>(null);
  const [viewer, setViewer] = useState<number | null>(shared ? null : humans[0]);
  const [owed, setOwed] = useState<{ seat: number; word: Word } | null>(null);
  const [said, setSaid] = useState<Record<number, Word>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const over = game.phase === 'roundOver' || game.phase === 'matchOver';
  // A person's turn while someone else's cards are on show: hand the phone over first.
  const handoff = !spotlight && !over && config.seats[game.turn].kind === 'human' && game.turn !== viewer ? game.turn : null;

  const announce = (seat: number, word: Word) => {
    setSaid((s) => ({ ...s, [seat]: word }));
    setNotice({ kind: 'said', seat, word });
  };

  /** Apply a move by `seat`; `card` is the card it put down, if any. */
  const commit = (seat: number, next: MatatuState, card?: MatatuCard) => {
    const before = game.hands[seat].length;
    const after = next.hands[seat].length;
    setGame(next);
    if (next.phase === 'roundOver' || next.phase === 'matchOver') setOwed(null);
    if (!card) return;
    setSpotlight({ seat, card });
    const live = next.phase !== 'roundOver' && next.phase !== 'matchOver' && next.inRound[seat];
    if (live && after < before && (after === 2 || after === 1)) {
      const word: Word = after === 2 ? 'warning' : 'oneCard';
      if (config.seats[seat].kind === 'bot') announce(seat, word);
      else setOwed({ seat, word });
    }
  };

  const runBot = (seat: number) => {
    const a = botAction(game, seat);
    if (a.type === 'play') {
      const card = game.hands[seat].find((c) => c.id === a.cardId)!;
      commit(seat, playCard(game, seat, a.cardId, Math.random), card);
    } else if (a.type === 'draw') commit(seat, drawCard(game, seat, Math.random));
    else if (a.type === 'keep') commit(seat, keepDrawn(game, seat));
    else if (a.type === 'suit') commit(seat, chooseSuit(game, seat, a.suit));
    else commit(seat, confirmCut(game, seat, a.end));
  };

  // Drive the table: clear the big card, run computer turns, ask for hand-overs.
  useEffect(() => {
    if (spotlight) {
      const id = setTimeout(() => setSpotlight(null), SPOTLIGHT_MS);
      return () => clearTimeout(id);
    }
    if (over) return;
    const seat = game.turn;
    if (config.seats[seat].kind === 'bot') {
      const id = setTimeout(() => runBot(seat), BOT_DELAY);
      return () => clearTimeout(id);
    }
    // runBot reads the same `game` this effect depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, spotlight]);

  // The hidden announcement timer: too slow and the table catches you.
  useEffect(() => {
    if (!owed) return;
    const id = setTimeout(() => {
      setGame((g) => penalize(g, owed.seat, Math.random));
      setNotice({ kind: 'caught', seat: owed.seat });
      setOwed(null);
    }, ANNOUNCE_MS);
    return () => clearTimeout(id);
  }, [owed]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  const myTurn = viewer !== null && game.turn === viewer && !spotlight && handoff === null;
  const mine = (fn: (seat: number) => void) => () => {
    if (myTurn && viewer !== null) fn(viewer);
  };

  const fresh = () => {
    setSpotlight(null);
    setOwed(null);
    setSaid({});
    setViewer(shared ? null : humans[0]);
  };

  return {
    game,
    spotlight,
    viewer,
    handoff,
    myTurn,
    humans,
    owed,
    said,
    notice,
    play: (card: MatatuCard) => mine((seat) => commit(seat, playCard(game, seat, card.id, Math.random), card))(),
    pick: mine((seat) => commit(seat, drawCard(game, seat, Math.random))),
    keep: mine((seat) => commit(seat, keepDrawn(game, seat))),
    choose: (suit: Suit) => mine((seat) => commit(seat, chooseSuit(game, seat, suit)))(),
    cut: (end: boolean) => mine((seat) => commit(seat, confirmCut(game, seat, end)))(),
    /** The person who owes an announcement says it in time. */
    sayIt: () => {
      if (owed) announce(owed.seat, owed.word);
      setOwed(null);
    },
    dismissSpotlight: () => setSpotlight(null),
    acceptHandoff: () => setViewer(handoff),
    nextRound: () => {
      setGame((g) => nextRound(g, cards, Math.random));
      fresh();
    },
    playAgain: () => {
      setGame((g) => newMatch(cards, n, config.handSize, (g.dealer + 1) % n, Math.random));
      fresh();
    },
  };
}
