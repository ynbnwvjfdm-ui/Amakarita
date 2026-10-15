import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tap } from './fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CARD_RATIO } from '../decks';
import { longDate } from '../dates';
import { useI18n } from '../i18n';
import { cardOfTheDay } from '../questions';
import { CardArt } from './CardArt';
import { FlipCard } from './FlipCard';
import { QuestionCard } from './QuestionCard';
import { colors, fonts, radius } from './theme';

/** Today's card: the question side up. Tapping turns it to the printed card (left for people to discover). */
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
      <Tap
        accessibilityRole="button"
        accessibilityLabel={flipped ? t('tapToFlipBack') : t('tapToReveal')}
        onPress={() => setFlipped((f) => !f)}
        style={styles.stage}
      >
        <FlipCard
          flipped={flipped}
          width={cardW}
          height={cardH}
          front={<QuestionCard question={q} width={cardW} view="read" />}
          back={<CardArt deckId={q.deck} cardId={q.card} width={cardW} />}
        />
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.ink, borderRadius: 28, padding: 16, gap: 8, overflow: 'hidden' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dateText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
