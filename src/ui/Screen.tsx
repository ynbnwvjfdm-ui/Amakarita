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
  /** Back button and a smaller title on one line, to leave room for a form. */
  compact?: boolean;
}

/**
 * Standard page: a compact header that scrolls away with the content, and an
 * optional pinned footer.
 */
export function Screen({ title, eyebrow, onBack, backLabel, right, children, footer, tabbed, compact }: Props) {
  const back = onBack ? (
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} hitSlop={12} style={styles.back}>
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  ) : null;
  return (
    <SafeAreaView style={styles.safe} edges={tabbed ? ['top'] : ['top', 'bottom']}>
      <View style={styles.column}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {compact ? (
            <View style={styles.compactRow}>
              {back}
              <Text style={styles.compactTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>
          ) : (
          <View style={styles.header}>
            {back}
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
              </View>
              {right ? <View style={styles.right}>{right}</View> : null}
            </View>
          </View>
          )}
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
  header: { gap: 10 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactTitle: { flex: 1, fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  titleBlock: { flex: 1, minWidth: 0 },
  right: { paddingBottom: 6 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink, letterSpacing: -0.8 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 18 },
  footer: { padding: 16, backgroundColor: colors.bg },
});

/** Shared text styles for setup forms. */
export const formStyles = StyleSheet.create({
  section: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
  sectionTight: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  /** A label with its control and note, kept close together. */
  group: { gap: 6 },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  warning: { fontFamily: fonts.semibold, fontSize: 14, color: colors.coral, textAlign: 'center' },
});
