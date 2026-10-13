import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StringKey, useI18n } from '../i18n';
import { TabName } from '../navigation';
import { colors, fonts, MAX_WIDTH, radius } from './theme';

const TABS: { name: TabName; label: StringKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'tabHome', icon: 'home' },
  { name: 'decks', label: 'tabDecks', icon: 'albums' },
  { name: 'games', label: 'tabGames', icon: 'game-controller' },
];

/** Rounded-square tabs on a dark bar; the open tab is lit. */
export function TabBar({ active, onSelect }: { active: TabName; onSelect: (t: TabName) => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const on = tab.name === active;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(tab.label)}
              onPress={() => onSelect(tab.name)}
              style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name={tab.icon} size={20} color={on ? colors.ink : colors.surface} />
              <Text style={[styles.label, on && styles.labelOn]}>{t(tab.label)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: MAX_WIDTH - 32,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.panel,
    padding: 8,
  },
  tab: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.10)' },
  tabOn: { backgroundColor: colors.lime },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.surface },
  labelOn: { color: colors.ink },
});
