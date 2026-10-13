import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../game/quiz';
import { useI18n } from '../i18n';
import { colors, fonts, radius } from './theme';

/** A card's question, answer and choices, for the author to check. */
export function QuestionReview({ question }: { question: Question | undefined }) {
  const { t } = useI18n();
  if (!question) return null;
  const heading =
    question.kind === 'which'
      ? t('whichCorrect')
      : question.kind === 'pick'
        ? question.category === 'kirazira'
          ? t('pickKirazira')
          : t('pickValue')
        : null;

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{t('question')}</Text>
      {question.kind === 'read' ? <Text style={styles.body}>{t('noQuestion')}</Text> : null}
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      {question.kind !== 'pick' && question.prompt
        ? question.prompt.map((l, i) => (
            <Text key={i} style={styles.prompt}>
              {l.replace('___', '_____')}
            </Text>
          ))
        : null}
      {question.options ? (
        <>
          <Text style={styles.label}>{t('choices')}</Text>
          <View style={styles.options}>
            {question.options.map((o) => {
              const right = o === question.answer;
              return (
                <View key={o} style={[styles.option, right && styles.right]}>
                  <Ionicons name={right ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={colors.ink} />
                  <Text style={styles.optionText}>{o}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
      {question.review ? (
        <>
          <Text style={styles.label}>{t('reviewNote')}</Text>
          <Text style={styles.body}>{question.review}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, padding: 16, gap: 8, marginHorizontal: 8 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
  heading: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  prompt: { fontFamily: fonts.card, fontSize: 24, lineHeight: 26, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  right: { backgroundColor: colors.lime, borderColor: colors.lime },
  optionText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
