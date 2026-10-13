import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, MAX_WIDTH } from './theme';

interface Props {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Standard page: title bar, scrolling content, optional pinned footer. */
export function Screen({ title, onBack, backLabel, right, children, footer }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.column}>
        <View style={styles.header}>
          {onBack ? (
            <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12} style={styles.back}>
              <Text style={styles.backText}>‹ {backLabel}</Text>
            </Pressable>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.right}>{right}</View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontSize: 16, color: colors.accent, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 4 },
  right: { position: 'absolute', right: 16, top: 12 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
});
