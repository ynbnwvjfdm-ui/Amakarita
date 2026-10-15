import { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

/**
 * Fills the screen and scrolls only when the content cannot fit, so on a very
 * short screen things move down instead of overlapping.
 */
export function FitScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.body} bounces={false} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  body: { flexGrow: 1 },
});
