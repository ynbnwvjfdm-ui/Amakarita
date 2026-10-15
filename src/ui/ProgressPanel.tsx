import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dayNumber } from '../dates';
import { DAILY_GOAL, answeredOn, streak } from '../game/progress';
import { useI18n } from '../i18n';
import { useProgress } from '../progressStore';
import { deckStats } from '../stats';
import { Button } from './Button';
import { CountUp, FillBar, Pulse, Tap } from './fx';
import { MedalIcon } from './Medal';
import { ShareSheet } from './ShareSheet';
import { colors, deckTheme, fonts, radius } from './theme';

/** How much the learner knows: all decks together, the streak, and one bar per deck. */
export function ProgressPanel({ onOpenDeck, onReview }: { onOpenDeck: (deckId: string) => void; onReview: () => void }) {
  const { t } = useI18n();
  const { progress } = useProgress();
  const decks = deckStats(progress);
  const known = decks.reduce((n, d) => n + d.known, 0);
  const total = decks.reduce((n, d) => n + d.total, 0);
  const today = dayNumber(new Date());
  const days = streak(progress, today);
  const done = Math.min(DAILY_GOAL, answeredOn(progress, today));
  const started = Object.keys(progress.cards).length > 0;
  const [sharing, setSharing] = useState(false);

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('progressTitle')}</Text>
        <View style={styles.headRight}>
          {days > 0 ? (
            <View style={styles.streak}>
              <Pulse>
                <Ionicons name="flame" size={14} color={colors.coral} />
              </Pulse>
              <Text style={styles.streakText}>{t('streakDays', { n: days })}</Text>
            </View>
          ) : null}
          {started ? (
            <Tap accessibilityRole="button" onPress={() => setSharing(true)} style={styles.shareBtn} hitSlop={6}>
              <Ionicons name="share-social-outline" size={15} color={colors.ink} />
              <Text style={styles.streakText}>{t('share')}</Text>
            </Tap>
          ) : null}
        </View>
      </View>
      {/* Today's goal: answering this many cards keeps the streak going. */}
      <View style={styles.goal}>
        <View style={styles.goalHead}>
          <Text style={styles.goalLabel}>{t('dailyGoal')}</Text>
          <Text style={styles.goalCount}>
            {done}/{DAILY_GOAL}
          </Text>
          {done >= DAILY_GOAL ? <Ionicons name="checkmark-circle" size={18} color={colors.ink} /> : null}
        </View>
        <View style={styles.goalTrack}>
          <FillBar share={done / DAILY_GOAL} style={styles.goalFill} />
        </View>
        {done >= DAILY_GOAL ? <Text style={styles.goalDone}>{t('goalReached')}</Text> : null}
        {/* Today's 10 cards: the ones this person keeps missing come first. */}
        <Button variant={done >= DAILY_GOAL ? 'secondary' : 'primary'} label={done >= DAILY_GOAL ? t('reviewMore') : t('reviewStart')} onPress={onReview} style={styles.reviewBtn} />
      </View>
      <View style={styles.big}>
        <CountUp value={known} style={styles.bigNumber} />
        <Text style={styles.bigTotal}>/{total}</Text>
        <Text style={styles.bigLabel}>{t('cardsKnown')}</Text>
      </View>
      {started ? null : <Text style={styles.empty}>{t('progressEmpty')}</Text>}
      <View style={styles.decks}>
        {decks.map(({ deck, known: k, total: n, medal }, i) => (
          <Tap key={deck.id} accessibilityRole="button" accessibilityLabel={`${deck.title}: ${t('knownOf', { n: k, total: n })}`} onPress={() => onOpenDeck(deck.id)} style={styles.deckRow}>
            <Text style={styles.deckName} numberOfLines={1}>
              {deck.title}
            </Text>
            <View style={styles.track}>
              <FillBar share={n ? k / n : 0} delay={80 * i} style={[styles.fill, { backgroundColor: deckTheme(deck.id).base }]} />
            </View>
            <Text style={styles.deckCount}>
              {k}/{n}
            </Text>
            <MedalIcon medal={medal} />
          </Tap>
        ))}
      </View>
      <ShareSheet visible={sharing} onClose={() => setSharing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 28, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  goal: { gap: 6, backgroundColor: colors.bg, borderRadius: 18, padding: 12 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  goalCount: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  goalTrack: { height: 10, borderRadius: 5, backgroundColor: colors.surface, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 5, backgroundColor: colors.lime },
  reviewBtn: { marginTop: 4 },
  goalDone: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  streakText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  big: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 4 },
  bigNumber: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.ink, letterSpacing: -1 },
  bigTotal: { fontFamily: fonts.bold, fontSize: 18, color: colors.muted },
  bigLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginLeft: 6 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  decks: { gap: 8 },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  deckName: { width: 104, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  deckCount: { width: 40, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});
