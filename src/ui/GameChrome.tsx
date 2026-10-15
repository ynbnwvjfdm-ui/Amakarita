import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tap } from './fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Bump } from './motion';
import { colors, fonts, radius } from './theme';

/** Close button on the left, pills in the middle and on the right, all one height. */
export function GameTopBar({ onLeave, leaveLabel, center, right }: { onLeave: () => void; leaveLabel: string; center: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <Tap accessibilityRole="button" accessibilityLabel={leaveLabel} onPress={onLeave} style={styles.round}>
        <Ionicons name="close" size={22} color={colors.ink} />
      </Tap>
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

export interface ChipProps {
  key?: string | number;
  name: string;
  value: string | number;
  active?: boolean;
  dim?: boolean;
  badge?: string | null;
  /** Shown instead of the value when the player is out or finished. */
  state?: string | null;
  /** A smaller chip (short name line over the number), for tables with many players. */
  compact?: boolean;
  width?: number;
}

const CHIP_GAP = 8;

/**
 * Every player's chip, all in view: one row of up to three, otherwise
 * smaller one-line chips in rows of two or three.
 */
export function PlayerChips({ width, players, compact: forceCompact }: { width: number; players: ChipProps[]; compact?: boolean }) {
  const n = players.length;
  const perRow = n <= 3 ? Math.max(n, 1) : n === 4 ? 2 : 3;
  const compact = forceCompact || n >= 4;
  const chipW = Math.floor((width - CHIP_GAP * (perRow - 1)) / perRow);
  return (
    <View style={styles.chips}>
      {players.map(({ key, ...p }, i) => (
        <PlayerChip key={key ?? i} {...p} compact={compact} width={n <= 2 ? Math.min(chipW, 150) : chipW} />
      ))}
    </View>
  );
}

/** A player's name over a big number (score or cards in hand). */
export function PlayerChip({ name, value, active, dim, badge, state, compact, width }: ChipProps) {
  if (compact) {
    // The name gets the chip's whole width, so "Umukinnyi 2" is never cut short.
    return (
      <View style={[styles.chip, styles.chipCompact, { width }, active && styles.chipOn, dim && styles.chipDim]}>
        <Text style={[styles.chipName, styles.chipNameCompact, active && styles.chipNameOn]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.chipHead}>
          <Bump value={state ?? value}>
            <Text style={[state ? styles.chipStateCompact : styles.chipValueCompact, active && styles.chipValueOn]} numberOfLines={1}>
              {state ?? value}
            </Text>
          </Bump>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.chip, width !== undefined && { width, minWidth: 0 }, active && styles.chipOn, dim && styles.chipDim]}>
      <View style={styles.chipHead}>
        <Text style={[styles.chipName, active && styles.chipNameOn]} numberOfLines={1}>
          {name}
        </Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      {state ? (
        <Text style={[styles.chipState, active && styles.chipNameOn]}>{state}</Text>
      ) : (
        <Bump value={value} style={styles.bumpLeft}>
          <Text style={[styles.chipValue, active && styles.chipValueOn]}>{value}</Text>
        </Bump>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  round: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  // Same width as the close button, so the middle pill stays centred.
  spacer: { width: 44 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, height: 40 },
  pillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_GAP, paddingVertical: 6 },
  chip: { minWidth: 96, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  chipOn: { backgroundColor: colors.lime },
  chipDim: { opacity: 0.45 },
  chipHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipName: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  chipCompact: { minWidth: 0, gap: 0, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  chipNameCompact: { fontSize: 11, lineHeight: 14 },
  chipValueCompact: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.surface },
  chipStateCompact: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 22, color: 'rgba(255,255,255,0.85)' },
  chipNameOn: { color: colors.ink },
  bumpLeft: { alignSelf: 'flex-start' },
  chipValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.surface, letterSpacing: -0.5 },
  chipValueOn: { color: colors.ink },
  chipState: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 32, color: 'rgba(255,255,255,0.85)' },
  badge: { fontFamily: fonts.display, fontSize: 11, color: colors.ink, backgroundColor: colors.lime, borderRadius: 8, paddingHorizontal: 5, overflow: 'hidden' },
});
