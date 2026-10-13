import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, MAX_WIDTH, radius } from './theme';

interface Props {
  title: string;
  /** Small line above the title. */
  eyebrow?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** On a tab: the tab bar sits below, so no bottom safe-area padding here. */
  tabbed?: boolean;
}

/** Standard page: title bar, scrolling content, optional pinned footer. */
export function Screen({ title, eyebrow, onBack, backLabel, right, children, footer, tabbed }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={tabbed ? ['top'] : ['top', 'bottom']}>
      <View style={styles.column}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} hitSlop={12} style={styles.back}>
                <Ionicons name="chevron-back" size={22} color={colors.ink} />
              </Pressable>
            ) : (
              <View />
            )}
            {right}
          </View>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted, marginTop: 6 },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: colors.ink, letterSpacing: -0.5 },
  content: { padding: 16, paddingBottom: 32, gap: 18 },
  footer: { padding: 16, backgroundColor: colors.bg },
});

/** Shared text styles for setup forms. */
export const formStyles = StyleSheet.create({
  section: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  warning: { fontFamily: fonts.semibold, fontSize: 14, color: colors.coral, textAlign: 'center' },
});
