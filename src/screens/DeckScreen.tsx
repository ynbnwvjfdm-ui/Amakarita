import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDeck, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardStatus, cardStatus, countKnown } from '../game/progress';
import { useProgress } from '../progressStore';
import { QUESTIONS, questionFor } from '../questions';
import { CardArt } from '../ui/CardArt';
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
  // Shrink the title so its longest word never breaks across lines.
  const titleRoom = W - 32 - 32 - 12 - 100;
  const longest = Math.max(...deck.title.split(' ').map((w) => w.length));
  const titleSize = Math.min(34, titleRoom / (longest * 0.58));
  const { progress } = useProgress();
  const asked = deck.cards.filter((c) => QUESTIONS[c.id]).map((c) => c.id);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.column, { width: W }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.base }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={nav.pop} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, { color: theme.onBase, fontSize: titleSize, lineHeight: titleSize * 1.12 }]}>{deck.title}</Text>
              {deck.subtitle ? <Text style={[styles.sub, { color: theme.onBase }]}>{deck.subtitle}</Text> : null}
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{t('cardsCount', { n: deck.cards.length })}</Text>
                </View>
                {asked.length ? (
                  <View style={[styles.chip, styles.chipLight]}>
                    <Text style={styles.chipText}>{t('knownOf', { n: countKnown(progress, asked), total: asked.length })}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <CardImage source={pageImage(deckId, deck.cover.page)} width={92} style={{ transform: [{ rotate: '6deg' }] }} />
          </View>
        </View>
        <View style={styles.grid}>
          {pages.map((p) => {
            const card = deck.cards.find((c) => c.page === p);
            return (
              <Pressable key={p} accessibilityRole="button" onPress={() => setOpen(p)} style={styles.cell}>
                <CardArt deckId={deckId} page={p} width={cardWidth} />
                {/* Where the learner stands with this card; an empty line keeps the rows even. */}
                {asked.length ? <StatusLine status={card && QUESTIONS[card.id] ? cardStatus(progress, card.id) : null} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <CardViewer
        art={open !== null ? { deckId, page: open } : null}
        onClose={() => setOpen(null)}
        footer={openCard ? <QuestionReview question={questionFor(openCard.id)} /> : undefined}
      />
    </SafeAreaView>
  );
}

const STATUS_COLOR: Record<CardStatus, string> = { new: colors.line, learning: '#E8A33D', known: '#2E9E5B' };
const STATUS_KEY = { new: 'statusNew', learning: 'statusLearning', known: 'statusKnown' } as const;

function StatusLine({ status }: { status: CardStatus | null }) {
  const { t } = useI18n();
  return (
    <View style={styles.status}>
      {status ? (
        <>
          <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {t(STATUS_KEY[status])}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { alignSelf: 'center', padding: 16, gap: 18 },
  hero: { borderRadius: 28, padding: 16, gap: 12 },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontFamily: fonts.display, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.semibold, fontSize: 15, opacity: 0.85 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chipLight: { backgroundColor: '#FFFFFF' },
  cell: { gap: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 16, paddingLeft: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 11, color: colors.muted },
  chip: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
