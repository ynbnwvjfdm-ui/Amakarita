import bankJson from './data/questions.json';
import { Question, QuestionBank } from './game/quiz';
import { dayNumber } from './dates';

export const QUESTIONS = bankJson as unknown as QuestionBank;

export function questionFor(cardId: string): Question | undefined {
  return QUESTIONS[cardId];
}

/** Card ids with a question to ask, deck by deck in print order. */
const ASKABLE = Object.values(QUESTIONS)
  .filter((q) => q.kind !== 'read')
  .map((q) => q.card);

/** Card ids answered by tapping a choice: the cards a daily review can use. */
export const REVIEWABLE = Object.values(QUESTIONS)
  .filter((q) => q.kind !== 'read' && q.options)
  .map((q) => q.card);

/** The same card for everyone all day, a different one each day. */
export function cardOfTheDay(date: Date): Question {
  const day = dayNumber(date);
  // Step by a prime so neighbouring days land in different decks.
  return QUESTIONS[ASKABLE[(day * 97) % ASKABLE.length]];
}
