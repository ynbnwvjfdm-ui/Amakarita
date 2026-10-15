import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StringKey, useI18n } from '../i18n';
import { TabName } from '../navigation';
import { Tap } from './fx';
import { useReducedMotion } from './motion';
import { colors, fonts, MAX_WIDTH, radius } from './theme';

const TABS: { name: TabName; label: StringKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'tabHome', icon: 'home' },
  { name: 'decks', label: 'tabDecks', icon: 'albums' },
  { name: 'games', label: 'tabGames', icon: 'game-controller' },
];

const PAD = 8;
const GAP = 8;

/** Rounded-square tabs on a dark bar; the lit square slides to the open tab, whose icon hops. */
export function TabBar({ active, onSelect }: { active: TabName; onSelect: (t: TabName) => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const index = TABS.findIndex((x) => x.name === active);
  const [barW, setBarW] = useState(0);
  const tabW = barW > 0 ? (barW - 2 * PAD - GAP * (TABS.length - 1)) / TABS.length : 0;
  const x = useSharedValue(index);
  useEffect(() => {
    x.set(reduced ? index : withSpring(index, { damping: 16, stiffness: 190, mass: 0.7 }));
  }, [index, reduced, x]);
  const lit = useAnimatedStyle(() => ({ width: tabW, transform: [{ translateX: x.get() * (tabW + GAP) }] }));
  const onLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist" onLayout={onLayout}>
        {tabW > 0 ? <Animated.View pointerEvents="none" style={[styles.lit, lit]} /> : null}
        {TABS.map((tab) => {
          const on = tab.name === active;
          return (
            <Tap
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(tab.label)}
              onPress={() => onSelect(tab.name)}
              pressScale={0.9}
              style={[styles.tab, on && (tabW === 0 ? styles.tabOn : styles.tabOnClear)]}
            >
              <Hop on={on}>
                <Ionicons name={tab.icon} size={20} color={on ? colors.ink : colors.surface} />
              </Hop>
              <Text style={[styles.label, on && styles.labelOn]}>{t(tab.label)}</Text>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

/** The icon jumps once when its tab opens. */
function Hop({ on, children }: { on: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (on && !reduced) y.set(withSequence(withTiming(-7, { duration: 120 }), withSpring(0, { damping: 6, stiffness: 260 })));
  }, [on, reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    gap: GAP,
    width: '100%',
    maxWidth: MAX_WIDTH - 32,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.panel,
    padding: PAD,
  },
  lit: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: 16, backgroundColor: colors.lime },
  tab: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.10)' },
  // Before the bar is measured the open tab lights itself; after that the sliding square does.
  tabOn: { backgroundColor: colors.lime },
  tabOnClear: { backgroundColor: 'transparent' },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.surface },
  labelOn: { color: colors.ink },
});
