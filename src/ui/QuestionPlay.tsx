import { Animated, StyleSheet, Text, View } from 'react-native';
import { Burst, FloatUp, Tap } from './fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DAILY_GOAL } from '../game/progress';
import { Question, cardPoints } from '../game/quiz';
import { useI18n } from '../i18n';
import { PopIn, useShake } from './motion';
import { colors, fonts, radius } from './theme';

interface Props {
  question: Question;
  /** The choices in the order shown. */
  options: string[];
  /** What the learner picked, once they have answered. */
  chosen: string | null;
  onChoose: (option: string) => void;
  /** Answers given today, counting this one: shown against the daily goal. */
  today: number;
}

/**
 * The choices for a card's question (the question itself is on the card).
 * Tap one and see straight away whether it was right.
 */
export function QuestionPlay({ question, options, chosen, onChoose, today }: Props) {
  const { t } = useI18n();
  const [shakeStyle, shake] = useShake();
  const answered = chosen !== null;
  const right = chosen === question.answer;
  const choose = (o: string) => {
    if (answered) return;
    if (o !== question.answer) shake();
    onChoose(o);
  };

  return (
    <View style={styles.panel}>
      <Animated.View style={[styles.options, shakeStyle]}>
        {options.map((o) => {
          const isAnswer = o === question.answer;
          const isChosen = o === chosen;
          const look = !answered ? null : isAnswer ? styles.optionRight : isChosen ? styles.optionWrong : styles.optionFaded;
          const icon = !answered ? null : isAnswer ? 'checkmark-circle' : isChosen ? 'close-circle' : null;
          return (
            <Tap
              key={o}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered, selected: isChosen }}
              disabled={answered}
              onPress={() => choose(o)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed, look]}
            >
              {icon ? <Ionicons name={icon} size={20} color={colors.ink} /> : null}
              <Text style={styles.optionText}>{o}</Text>
            </Tap>
          );
        })}
      </Animated.View>

      {answered ? (
        <PopIn from="grow" style={styles.result}>
          <View style={[styles.verdict, { backgroundColor: right ? colors.lime : colors.coral }]}>
            <Ionicons name={right ? 'checkmark' : 'close'} size={20} color={colors.ink} />
            <Text style={styles.verdictText}>{right ? t('correct') : t('notQuite')}</Text>
            {/* A right answer bursts and its points rise; the answer that meets today's goal bursts bigger. */}
            <Burst trigger={right ? question.card : null} big={today === DAILY_GOAL} />
            {right && cardPoints(question) > 0 ? <FloatUp trigger={question.card} text={`+${cardPoints(question)}`} /> : null}
          </View>
          <Text style={styles.goal}>{today >= DAILY_GOAL ? t('goalReached') : `${t('dailyGoal')}: ${today}/${DAILY_GOAL}`}</Text>
        </PopIn>
      ) : null}

      {answered && question.review ? (
        <>
          <Text style={styles.label}>{t('reviewNote')}</Text>
          <Text style={styles.body}>{question.review}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.2 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.surface },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionPressed: { backgroundColor: colors.line, transform: [{ scale: 0.98 }] },
  optionRight: { backgroundColor: colors.lime },
  optionWrong: { backgroundColor: colors.coral },
  optionFaded: { opacity: 0.4 },
  optionText: { flexShrink: 1, fontFamily: fonts.card, fontSize: 18, color: colors.ink, textAlign: 'center' },
  result: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  verdictText: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  goal: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
});
