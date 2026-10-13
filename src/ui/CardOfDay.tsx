import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CARD_RATIO, cardImage } from '../decks';
import { longDate } from '../dates';
import { useI18n } from '../i18n';
import { cardOfTheDay } from '../questions';
import { CardImage } from './CardImage';
import { FlipCard } from './FlipCard';
import { QuestionCard } from './QuestionCard';
import { colors, fonts, radius } from './theme';

/** Today's card: the question side up; tap to turn it and see the printed card. */
export function CardOfDay({ width }: { width: number }) {
  const { t, lang } = useI18n();
  const [today] = useState(() => new Date());
  const [flipped, setFlipped] = useState(false);
  const q = cardOfTheDay(today);
  const cardW = Math.min(250, width * 0.66);
  const cardH = cardW / CARD_RATIO;

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('cardOfDay')}</Text>
        <View style={styles.date}>
          <Ionicons name="calendar-outline" size={14} color={colors.ink} />
          <Text style={styles.dateText}>{longDate(today, lang)}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={flipped ? t('tapToFlipBack') : t('tapToReveal')}
        onPress={() => setFlipped((f) => !f)}
        style={styles.stage}
      >
        {/* Two cards fanned behind, like a small pile. */}
        <View style={[styles.behind, { width: cardW, height: cardH, transform: [{ rotate: '7deg' }, { translateX: 18 }] }]} />
        <View style={[styles.behind, styles.behind2, { width: cardW, height: cardH, transform: [{ rotate: '-8deg' }, { translateX: -16 }] }]} />
        <FlipCard
          flipped={flipped}
          width={cardW}
          height={cardH}
          style={{ transform: [{ rotate: '-2deg' }] }}
          front={<QuestionCard question={q} width={cardW} view="read" />}
          back={<CardImage source={cardImage(q.deck, q.card)} width={cardW} />}
        />
      </Pressable>
      <View style={styles.hint}>
        <Ionicons name={flipped ? 'refresh' : 'hand-left-outline'} size={16} color={colors.muted} />
        <Text style={styles.hintText}>{flipped ? t('tapToFlipBack') : t('tapToReveal')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.ink, borderRadius: 28, padding: 16, gap: 8, overflow: 'hidden' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dateText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  behind: { position: 'absolute', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.28)' },
  behind2: { backgroundColor: 'rgba(255,255,255,0.16)' },
  hint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'center', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  hintText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
