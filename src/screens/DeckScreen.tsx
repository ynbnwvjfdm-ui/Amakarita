import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDeck, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { questionFor } from '../questions';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { QuestionReview } from '../ui/QuestionReview';
import { colors, deckTheme, fonts, MAX_WIDTH, radius } from '../ui/theme';

/** Every page of a deck, in print order. Tap a card to see it large with its question. */
export function DeckScreen({ deckId }: { deckId: string }) {
  const { t } = useI18n();
  const nav = useNav();
  const deck = getDeck(deckId);
  const theme = deckTheme(deckId);
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<number | null>(null);
  const W = Math.min(width, MAX_WIDTH);
  const cardWidth = (W - 32 - 2 * 10) / 3;
  const pages = Array.from({ length: deck.pageCount }, (_, i) => i + 1);
  const openCard = open !== null ? deck.cards.find((c) => c.page === open) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.column, { width: W }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.base }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={nav.pop} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, { color: theme.onBase }]}>{deck.title}</Text>
              {deck.subtitle ? <Text style={[styles.sub, { color: theme.onBase }]}>{deck.subtitle}</Text> : null}
              <View style={styles.chip}>
                <Text style={styles.chipText}>{t('cardsCount', { n: deck.cards.length })}</Text>
              </View>
            </View>
            <CardImage source={pageImage(deckId, deck.cover.page)} width={92} style={{ transform: [{ rotate: '6deg' }] }} />
          </View>
        </View>
        <View style={styles.grid}>
          {pages.map((p) => (
            <Pressable key={p} accessibilityRole="button" onPress={() => setOpen(p)}>
              <CardImage source={pageImage(deckId, p)} width={cardWidth} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <CardViewer
        source={open !== null ? pageImage(deckId, open) : null}
        onClose={() => setOpen(null)}
        footer={openCard ? <QuestionReview question={questionFor(openCard.id)} /> : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { alignSelf: 'center', padding: 16, gap: 18 },
  hero: { borderRadius: 28, padding: 16, gap: 12 },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.semibold, fontSize: 15, opacity: 0.85 },
  chip: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  chipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
