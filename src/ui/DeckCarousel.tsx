import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { CardImage } from './CardImage';
import { colors, deckTheme, fonts, radius } from './theme';

interface Props {
  /** Room available across. */
  width: number;
  onOpen: (deckId: string) => void;
}

const ARROW = 44;
const ARROW_GAP = 8;

/** One deck at a time, with arrows either side; swipe or tap an arrow for the next. */
export function DeckCarousel({ width, onOpen }: Props) {
  const { t } = useI18n();
  const pageW = width - 2 * (ARROW + ARROW_GAP);
  const cardW = Math.min(Math.round(width * 0.52), pageW);
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const deck = DECKS[index];
  const theme = deckTheme(deck.id);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
    setIndex(Math.max(0, Math.min(DECKS.length - 1, i)));
  };
  const goTo = (i: number) => {
    const next = (i + DECKS.length) % DECKS.length;
    setIndex(next);
    scroller.current?.scrollTo({ x: next * pageW, animated: true });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('previous')} onPress={() => goTo(index - 1)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: pageW }}
          scrollEventThrottle={16}
          onScroll={settle}
          onMomentumScrollEnd={settle}
        >
          {DECKS.map((d) => (
            <View key={d.id} style={[styles.page, { width: pageW }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={d.title} onPress={() => onOpen(d.id)}>
                <CardImage source={pageImage(d.id, d.cover.page)} width={cardW} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel={t('next')} onPress={() => goTo(index + 1)} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={() => onOpen(deck.id)} style={styles.caption}>
        <View style={[styles.swatch, { backgroundColor: theme.base }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{deck.title}</Text>
          <Text style={styles.sub}>
            {deck.subtitle ? `${deck.subtitle} · ` : ''}
            {t('cardsCount', { n: deck.cards.length })}
          </Text>
        </View>
        <View style={styles.open}>
          <Text style={styles.openText}>›</Text>
        </View>
      </Pressable>

      <View style={styles.dots}>
        {DECKS.map((d, i) => (
          <View key={d.id} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: ARROW_GAP },
  arrow: { width: ARROW, height: ARROW, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  page: { alignItems: 'center', paddingVertical: 10 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.panel, padding: 12 },
  swatch: { width: 36, height: 36, borderRadius: 12 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  open: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  openText: { color: colors.surface, fontSize: 22, lineHeight: 24, fontFamily: fonts.bold },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.ink },
});
