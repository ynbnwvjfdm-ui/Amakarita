import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dayNumber } from '../dates';
import { SUITED_DECKS } from '../decks';
import { countKnown, streak } from '../game/progress';
import { useI18n } from '../i18n';
import { useProgress } from '../progressStore';
import { QUESTIONS } from '../questions';
import { colors, deckTheme, fonts, radius } from './theme';

const cardsOf = (deckId: string) => Object.values(QUESTIONS).filter((q) => q.deck === deckId).map((q) => q.card);

/** How much the learner knows: all decks together, the streak, and one bar per deck. */
export function ProgressPanel({ onOpenDeck }: { onOpenDeck: (deckId: string) => void }) {
  const { t } = useI18n();
  const { progress } = useProgress();
  const decks = SUITED_DECKS.map((d) => {
    const ids = cardsOf(d.id);
    return { deck: d, known: countKnown(progress, ids), total: ids.length };
  });
  const known = decks.reduce((n, d) => n + d.known, 0);
  const total = decks.reduce((n, d) => n + d.total, 0);
  const days = streak(progress, dayNumber(new Date()));
  const started = Object.keys(progress.cards).length > 0;

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('progressTitle')}</Text>
        {days > 0 ? (
          <View style={styles.streak}>
            <Ionicons name="flame" size={14} color={colors.coral} />
            <Text style={styles.streakText}>{t('streakDays', { n: days })}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.big}>
        <Text style={styles.bigNumber}>{known}</Text>
        <Text style={styles.bigTotal}>/{total}</Text>
        <Text style={styles.bigLabel}>{t('cardsKnown')}</Text>
      </View>
      {started ? null : <Text style={styles.empty}>{t('progressEmpty')}</Text>}
      <View style={styles.decks}>
        {decks.map(({ deck, known: k, total: n }) => (
          <Pressable key={deck.id} accessibilityRole="button" accessibilityLabel={`${deck.title}: ${t('knownOf', { n: k, total: n })}`} onPress={() => onOpenDeck(deck.id)} style={styles.deckRow}>
            <Text style={styles.deckName} numberOfLines={1}>
              {deck.title}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${n ? (k / n) * 100 : 0}%`, backgroundColor: deckTheme(deck.id).base }]} />
            </View>
            <Text style={styles.deckCount}>
              {k}/{n}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 28, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  streakText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  big: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 4 },
  bigNumber: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.ink, letterSpacing: -1 },
  bigTotal: { fontFamily: fonts.bold, fontSize: 18, color: colors.muted },
  bigLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginLeft: 6 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  decks: { gap: 8 },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  deckName: { width: 112, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  deckCount: { width: 44, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});
