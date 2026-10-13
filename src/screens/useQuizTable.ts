import { useEffect, useMemo, useState } from 'react';
import { QuizState, answer, applyJoker, draw, judge, newQuiz, nextTurn, stealTarget } from '../game/quiz';
import { SUITED_DECKS } from '../decks';
import { QUESTIONS } from '../questions';
import { QuizConfig } from '../navigation';

/** Pauses, in milliseconds, so people can follow a computer's turn. */
export const BOT_DRAW = 700;
export const BOT_THINK = 1400;
export const BOT_NEXT = 2600;
/** How often a computer player knows the answer. */
export const BOT_KNOWS = 0.65;

/** Runs one game of "Amakarita": drawing, answering, jokers and computer turns. */
export function useQuizTable(config: QuizConfig) {
  const n = config.seats.length;
  const cardIds = useMemo(() => {
    const decks = config.deckId === 'mix' ? SUITED_DECKS.map((d) => d.id) : [config.deckId];
    return Object.values(QUESTIONS)
      .filter((q) => decks.includes(q.deck))
      .map((q) => q.card);
  }, [config.deckId]);

  const fresh = () => newQuiz(QUESTIONS, cardIds, n, config.mode, config.attempts, Math.random);
  const [game, setGame] = useState<QuizState>(fresh);
  // Group mode: the reader has looked at the answer.
  const [revealed, setRevealed] = useState(false);
  const bot = config.seats[game.turn]?.kind === 'bot';

  useEffect(() => {
    if (!bot || game.phase === 'over') return;
    let id: ReturnType<typeof setTimeout>;
    if (game.phase === 'draw') {
      id = setTimeout(() => setGame((g) => draw(g, QUESTIONS, Math.random)), BOT_DRAW);
    } else if (game.phase === 'answer') {
      id = setTimeout(() => {
        setGame((g) => {
          const t = g.current!;
          const right = t.question.answer!;
          const wrong = t.options.filter((o) => o !== right);
          const pick = Math.random() < BOT_KNOWS || !wrong.length ? right : wrong[Math.floor(Math.random() * wrong.length)];
          return answer(g, pick);
        });
      }, BOT_THINK);
    } else if (game.phase === 'joker') {
      id = setTimeout(() => {
        setGame((g) => {
          const from = stealTarget(g, g.turn);
          return applyJoker(g, from !== null && g.scores[from] >= 10 ? 'steal' : 'double');
        });
      }, BOT_THINK);
    } else if (game.phase === 'result') {
      id = setTimeout(() => setGame((g) => nextTurn(g)), BOT_NEXT);
    }
    return () => clearTimeout(id);
  }, [game, bot]);

  const humanTurn = !bot && game.phase !== 'over';

  return {
    game,
    bot,
    revealed,
    cardIds,
    draw: () => humanTurn && game.phase === 'draw' && setGame(draw(game, QUESTIONS, Math.random)),
    choose: (option: string) => humanTurn && game.phase === 'answer' && setGame(answer(game, option)),
    reveal: () => setRevealed(true),
    judge: (correct: boolean) => {
      if (game.phase !== 'answer') return;
      setGame(judge(game, correct));
    },
    joker: (power: 'steal' | 'double') => humanTurn && game.phase === 'joker' && setGame(applyJoker(game, power)),
    next: () => {
      if (game.phase !== 'result') return;
      setRevealed(false);
      setGame(nextTurn(game));
    },
    playAgain: () => {
      setRevealed(false);
      setGame(fresh());
    },
  };
}
