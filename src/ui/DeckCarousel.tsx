import { useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { CardImage } from './CardImage';
import { colors, deckTheme, fonts, radius } from './theme';

interface Props {
  width: number;
  onOpen: (deckId: string) => void;
}

/** The six decks side by side: the one in the middle full size, its neighbours peeking. */
export function DeckCarousel({ width, onOpen }: Props) {
  const { t } = useI18n();
  const itemW = Math.round(width * 0.52);
  const gap = 14;
  const step = itemW + gap;
  const side = (width - itemW) / 2;
  const [x] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);
  const deck = DECKS[index];
  const theme = deckTheme(deck.id);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    setIndex(Math.max(0, Math.min(DECKS.length - 1, i)));
  };

  return (
    <View style={{ gap: 14 }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: side, gap, paddingVertical: 10 }}
        style={{ marginHorizontal: -16 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
          useNativeDriver: Platform.OS !== 'web',
          listener: settle,
        })}
        onMomentumScrollEnd={settle}
      >
        {DECKS.map((d, i) => {
          const input = [(i - 1) * step, i * step, (i + 1) * step];
          const scale = x.interpolate({ inputRange: input, outputRange: [0.84, 1, 0.84], extrapolate: 'clamp' });
          const opacity = x.interpolate({ inputRange: input, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' });
          const rotate = x.interpolate({ inputRange: input, outputRange: ['6deg', '0deg', '-6deg'], extrapolate: 'clamp' });
          return (
            <Animated.View key={d.id} style={{ width: itemW, opacity, transform: [{ scale }, { rotate }] }}>
              <Pressable accessibilityRole="button" accessibilityLabel={d.title} onPress={() => onOpen(d.id)}>
                <CardImage source={pageImage(d.id, d.cover.page)} width={itemW} />
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

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
