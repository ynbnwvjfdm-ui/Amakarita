import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts, radius } from './theme';

/** Close button on the left, pills in the middle and on the right, all one height. */
export function GameTopBar({ onLeave, leaveLabel, center, right }: { onLeave: () => void; leaveLabel: string; center: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel={leaveLabel} onPress={onLeave} style={styles.round}>
        <Ionicons name="close" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.center}>{center}</View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

/** A white pill with an icon or small picture and a short label. */
export function InfoPill({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <View style={styles.pill} accessibilityLabel={label}>
      {children}
    </View>
  );
}

export function PillText({ children, color }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.pillText, color ? { color } : null]}>{children}</Text>;
}

interface ChipProps {
  name: string;
  value: string | number;
  active?: boolean;
  dim?: boolean;
  badge?: string | null;
  /** Shown instead of the value when the player is out or finished. */
  state?: string | null;
}

/** A player's name over a big number (score or cards in hand). */
export function PlayerChip({ name, value, active, dim, badge, state }: ChipProps) {
  return (
    <View style={[styles.chip, active && styles.chipOn, dim && styles.chipDim]}>
      <View style={styles.chipHead}>
        <Text style={[styles.chipName, active && styles.chipNameOn]} numberOfLines={1}>
          {name}
        </Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      {state ? (
        <Text style={[styles.chipState, active && styles.chipNameOn]}>{state}</Text>
      ) : (
        <Text style={[styles.chipValue, active && styles.chipValueOn]}>{value}</Text>
      )}
    </View>
  );
}

export const CHIP_ROW = { gap: 8, paddingVertical: 6 };

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  round: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  // Same width as the close button, so the middle pill stays centred.
  spacer: { width: 44 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, height: 40 },
  pillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  chip: { minWidth: 96, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  chipOn: { backgroundColor: colors.lime },
  chipDim: { opacity: 0.45 },
  chipHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipName: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.85)', maxWidth: 110 },
  chipNameOn: { color: colors.ink },
  chipValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.surface, letterSpacing: -0.5 },
  chipValueOn: { color: colors.ink },
  chipState: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 32, color: 'rgba(255,255,255,0.85)' },
  badge: { fontFamily: fonts.display, fontSize: 11, color: colors.ink, backgroundColor: colors.lime, borderRadius: 8, paddingHorizontal: 5, overflow: 'hidden' },
});
