import { useState } from 'react';
import { getDeck } from '../decks';
import { RiddleState, judgeRiddle, newRiddles, nextRiddle, soma } from '../game/ibisakuzo';
import { drawWeight, weightedOrder } from '../game/progress';
import { IbisakuzoConfig } from '../navigation';
import { useProgress } from '../progressStore';

const RIDDLES = getDeck('ibisakuzo').cards.map((c) => c.id);

/** Runs one game of Ibisakuzo: the call and answer, uncovering the answer, scores and swaps. */
export function useIbisakuzoTable(config: IbisakuzoConfig) {
  const n = config.seats.length;
  const { progressOf, record } = useProgress();
  // A seat's answers count for the profile chosen for it; guests count for nobody.
  const learnerOf = (seat: number): string | null => config.seats[seat]?.profileId ?? null;
  const learners = [...new Set(config.seats.map((_, i) => learnerOf(i)).filter((id): id is string => id !== null))];
  // Riddles these learners have missed before come up earlier.
  const weight = (cardId: string) => Math.max(...learners.map((id) => drawWeight(progressOf(id), cardId)));
  const fresh = () =>
    newRiddles(RIDDLES, n, config.attempts, Math.random, learners.length ? (ids, rng) => weightedOrder(ids, weight, rng) : undefined);
  const [game, setGame] = useState<RiddleState>(fresh);
  // The asker has uncovered the answer.
  const [revealed, setRevealed] = useState(false);

  return {
    game,
    revealed,
    learners,
    soma: () => game.phase === 'sakwe' && setGame(soma(game)),
    reveal: () => game.phase === 'riddle' && setRevealed(true),
    judge: (correct: boolean) => {
      if (game.phase !== 'riddle' || !revealed) return;
      const g = judgeRiddle(game, correct);
      const id = learnerOf(game.turn);
      if (id && game.current) record(id, game.current, correct);
      setGame(g);
    },
    next: () => {
      if (game.phase !== 'result') return;
      setRevealed(false);
      setGame(nextRiddle(game));
    },
    playAgain: () => {
      setRevealed(false);
      setGame(fresh());
    },
  };
}
