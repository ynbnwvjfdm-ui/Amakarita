import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CARD_RATIO, getDeck } from '../decks';
import { Category, Question, cardPoints } from '../game/quiz';
import { useI18n } from '../i18n';
import { SUIT_SYMBOL } from './table';
import { colors, deckTheme, fonts, radius } from './theme';

interface Props {
  question: Question;
  width: number;
  /**
   * quiz:  as asked on the phone (choices shown elsewhere).
   * read:  the card's words with a blank, for reading aloud.
   */
  view: 'quiz' | 'read';
  /** Fill the blank with the answer. */
  revealed?: boolean;
  /** Group mode for Kirazira/Indangagaciro: the statement read out. */
  sort?: { statement: string; answer: Category; card: string };
  doubled?: boolean;
  style?: ViewStyle;
}

const BLANK = '___';

/** A question drawn as a card in its deck's colours, lettered like the printed cards. */
export function QuestionCard({ question, width, view, revealed, sort, doubled, style }: Props) {
  const { t } = useI18n();
  const theme = deckTheme(question.deck);
  const deck = getDeck(question.deck);
  const height = width / CARD_RATIO;
  const red = question.suit === 'hearts' || question.suit === 'diamonds';
  const points = cardPoints(question);
  const s = width / 300; // scale everything with the card

  let heading: string | null = null;
  let lines: string[] = [];
  if (question.kind === 'read') {
    heading = t('readCard');
  } else if (question.kind === 'pick') {
    if (sort) {
      lines = [sort.statement];
      heading = revealed ? (sort.answer === 'kirazira' ? t('kirazira') : t('indangagaciro')) : t('sortQuestion');
    } else if (view === 'read' || revealed) {
      lines = [question.statement!];
      heading = question.category === 'kirazira' ? t('kirazira') : t('indangagaciro');
    } else {
      heading = question.category === 'kirazira' ? t('pickKirazira') : t('pickValue');
    }
  } else if (question.kind === 'which' && view === 'quiz' && !revealed) {
    heading = t('whichCorrect');
  } else {
    lines = question.prompt ?? [];
  }

  const chars = lines.join(' ').length;
  const size = (chars > 90 ? 16 : chars > 55 ? 19 : chars > 28 ? 23 : 29) * s;

  return (
    <View testID="card" style={[styles.card, { width, height, backgroundColor: theme.face, borderRadius: 18 * s, padding: 16 * s }, style]}>
      <View style={styles.top}>
        {question.rank && question.suit ? (
          <View style={styles.cornerCol}>
            <Text style={[styles.rank, { fontSize: 34 * s, lineHeight: 36 * s, letterSpacing: -1.5 * s, color: red ? theme.accent : theme.ink }]}>{question.rank}</Text>
            <Text style={[styles.rank, { fontSize: 24 * s, lineHeight: 26 * s, marginTop: -2, color: red ? theme.accent : theme.ink }]}>{SUIT_SYMBOL[question.suit]}</Text>
          </View>
        ) : (
          <Text style={[styles.rank, { fontSize: 21 * s, letterSpacing: 1 * s, color: question.card.endsWith('joker2') ? theme.accent : theme.ink }]}>JOKER</Text>
        )}
        {/* The deck name would give away a taboo-or-value answer. */}
        {sort ? null : (
          <View style={[styles.pill, { backgroundColor: theme.base, paddingHorizontal: 10 * s, paddingVertical: 4 * s }]}>
            <Text style={[styles.pillText, { color: theme.onBase, fontSize: 11 * s }]} numberOfLines={1}>
              {deck.title}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {heading ? (
          <Text style={[styles.heading, { color: theme.ink, fontSize: (lines.length ? 15 : 24) * s, lineHeight: (lines.length ? 20 : 30) * s }]}>
            {heading}
          </Text>
        ) : null}
        {lines.map((line, i) => {
          const [before, after] = line.split(BLANK);
          const hasBlank = after !== undefined;
          return (
            <Text key={i} style={[styles.line, { color: theme.ink, fontSize: size, lineHeight: size * 1.2 }]}>
              {before}
              {hasBlank ? (
                revealed ? (
                  <Text style={{ color: theme.accent }}>{question.answer}</Text>
                ) : (
                  <Text style={[styles.blank, { backgroundColor: theme.accent, color: theme.face }]}>{'  ?  '}</Text>
                )
              ) : null}
              {hasBlank ? after : null}
            </Text>
          );
        })}
      </View>

      <View style={styles.bottom}>
        {points > 0 ? (
          <View style={[styles.points, { paddingHorizontal: 10 * s, paddingVertical: 4 * s }]}>
            <Text style={[styles.pointsText, { fontSize: 13 * s }]}>+{doubled ? points * 2 : points}</Text>
          </View>
        ) : (
          <View />
        )}
        {doubled ? <Text style={[styles.double, { fontSize: 13 * s, color: theme.accent }]}>×2</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rank: { fontFamily: fonts.card },
  cornerCol: { alignItems: 'center' },
  pill: { borderRadius: radius.pill, maxWidth: '62%' },
  pillText: { fontFamily: fonts.bold, letterSpacing: 0.3 },
  body: { flex: 1, justifyContent: 'center', gap: 6 },
  heading: { fontFamily: fonts.bold, textAlign: 'center' },
  line: { fontFamily: fonts.card, textAlign: 'center', letterSpacing: -0.3 },
  blank: { borderRadius: 6, overflow: 'hidden' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  points: { backgroundColor: colors.lime, borderRadius: radius.pill },
  pointsText: { fontFamily: fonts.display, color: colors.ink },
  double: { fontFamily: fonts.display },
});
