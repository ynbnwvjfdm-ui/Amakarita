import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '../i18n';
import { CardArt } from './CardArt';
import { feel, PopIn } from './motion';
import { colors, fonts, radius } from './theme';

interface Props {
  deckId: string;
  cards: { id: string; label: string }[];
  /** Room available across. */
  width: number;
  onPress: (id: string) => void;
  /** Colour of the "1–3 / 7" count, to suit the table behind it. */
  ink?: string;
}

const PER_VIEW = 3;
const GAP = 10;

export function handCardWidth(width: number): number {
  return Math.floor((width - GAP * (PER_VIEW - 1)) / PER_VIEW);
}

/**
 * The hand as big cards in one row, three whole cards in view. Swipe, or tap
 * the arrows, to see the rest; it always stops on whole cards.
 */
export function HandRow({ deckId, cards, width, onPress, ink = colors.surface }: Props) {
  const { t } = useI18n();
  const scroller = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const cardW = handCardWidth(width);
  const step = cardW + GAP;
  const viewW = PER_VIEW * cardW + (PER_VIEW - 1) * GAP;
  const n = cards.length;
  const lastFirst = Math.max(0, n - PER_VIEW);
  const first = Math.min(lastFirst, Math.max(0, Math.round(offset / step)));

  // Each card comes in when it first appears: dealt one after another, or picked from the pile.
  const card = (c: { id: string; label: string }, i: number) => (
    <PopIn key={c.id} delay={Math.min(i, 6) * 60}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={c.label}
        onPress={() => {
          feel.tap();
          onPress(c.id);
        }}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <CardArt deckId={deckId} cardId={c.id} width={cardW} />
      </Pressable>
    </PopIn>
  );

  if (n <= PER_VIEW) {
    return <View style={[styles.row, { width: viewW }]}>{cards.map(card)}</View>;
  }

  const goTo = (i: number) => {
    const x = Math.min(lastFirst, Math.max(0, i)) * step;
    setOffset(x);
    scroller.current?.scrollTo({ x, animated: true });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setOffset(e.nativeEvent.contentOffset.x);

  return (
    <View>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: viewW, alignSelf: 'center', flexGrow: 0 }}
        contentContainerStyle={styles.content}
        scrollEventThrottle={32}
        onScroll={onScroll}
        // Stop on whole cards: the browser snaps each card, phones snap every card width.
        {...(Platform.OS === 'web' ? { pagingEnabled: true } : { snapToInterval: step, decelerationRate: 'fast' as const })}
      >
        {cards.map(card)}
      </ScrollView>
      <View style={styles.pager}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('previous')} disabled={first === 0} onPress={() => goTo(first - PER_VIEW)} style={[styles.arrow, first === 0 && styles.arrowOff]}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={[styles.count, { color: ink }]}>
          {first + 1}–{Math.min(n, first + PER_VIEW)} / {n}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('next')} disabled={first >= lastFirst} onPress={() => goTo(first + PER_VIEW)} style={[styles.arrow, first >= lastFirst && styles.arrowOff]}>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: GAP, alignSelf: 'center' },
  // Room under the cards inside the scroller, so their shadow isn't cut off; it replaces the gap above the arrows.
  content: { gap: GAP, paddingBottom: 8 },
  pressed: { opacity: 0.75 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  arrowOff: { opacity: 0.35 },
  count: { fontFamily: fonts.bold, fontSize: 15, minWidth: 72, textAlign: 'center' },
});
