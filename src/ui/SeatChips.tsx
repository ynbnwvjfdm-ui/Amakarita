import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Tap } from './fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Profile } from '../game/profiles';
import { useI18n } from '../i18n';
import { SeatConfig } from '../navigation';
import { useProgress } from '../progressStore';
import { defaultSeats } from './SeatEditor';
import { Button } from './Button';
import { formStyles } from './Screen';
import { Panel } from './table';
import { colors, fonts, radius } from './theme';

interface Props {
  seats: SeatConfig[];
  onChange: (index: number, patch: Partial<SeatConfig>) => void;
  /** Room available across. */
  width: number;
  /** Every seat is a person; tapping does nothing. */
  peopleOnly?: boolean;
  /** Section title, shown on the same line as the names link. */
  title: string;
}

const GAP = 8;

/** The usual seats, with the first played by the person whose profile is active. */
export function seatsFor(active: Profile): SeatConfig[] {
  return defaultSeats().map((s, i) => (i === 0 ? { kind: 'human', name: active.name, profileId: active.id } : s));
}

/**
 * One small tile per player, three to a row: tap a tile to switch between a
 * person and the phone. Names are written in a separate panel so the form
 * stays on one screen.
 */
export function SeatChips({ seats, onChange, width, peopleOnly, title }: Props) {
  const { t } = useI18n();
  const { profiles } = useProgress();
  const [naming, setNaming] = useState(false);
  const color = (s: SeatConfig) => profiles.find((p) => p.id === s.profileId)?.color;
  const perRow = Math.min(3, Math.max(1, seats.length));
  const chipW = Math.floor((width - GAP * (perRow - 1)) / perRow);
  const kindLabel = (s: SeatConfig) => (s.kind === 'human' ? t('person') : t('phone'));

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[formStyles.sectionTight, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        <Tap accessibilityRole="button" onPress={() => setNaming(true)} style={styles.namesButton} hitSlop={8}>
          <Ionicons name="create-outline" size={16} color={colors.ink} />
          <Text style={styles.namesText}>{t('writeNames')}</Text>
        </Tap>
      </View>
      <View style={styles.grid}>
        {seats.map((seat, i) => {
          const human = peopleOnly || seat.kind === 'human';
          const name = seat.name ?? t('playerN', { n: i + 1 });
          return (
            <Tap
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`${name}: ${human ? t('person') : t('phone')}`}
              disabled={peopleOnly}
              onPress={() => onChange(i, { kind: seat.kind === 'human' ? 'bot' : 'human' })}
              style={({ pressed }) => [styles.chip, { width: chipW }, human ? styles.chipHuman : styles.chipBot, pressed && styles.pressed]}
            >
              {/* The name gets the tile's whole width, so "Umukinnyi 2" is never cut short. */}
              <View style={styles.nameRow}>
                {human && color(seat) ? <View style={[styles.dot, { backgroundColor: color(seat) }]} /> : null}
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
              </View>
              <View style={styles.kindRow}>
                <Ionicons name={human ? 'person' : 'phone-portrait-outline'} size={14} color={human ? colors.ink : colors.muted} />
                <Text style={[styles.kind, !human && styles.kindBot]} numberOfLines={1}>
                  {peopleOnly ? t('person') : kindLabel(seat)}
                </Text>
              </View>
            </Tap>
          );
        })}
      </View>

      <Panel visible={naming} title={t('writeNames')} onRequestClose={() => setNaming(false)}>
        {seats.map((seat, i) => (
          <View key={i} style={styles.seatForm}>
            {/* A person can pick their saved profile, so the game counts for them. */}
            {(peopleOnly || seat.kind === 'human') && profiles.length ? (
              <View style={styles.profileChips}>
                {profiles.map((p) => {
                  const on = seat.profileId === p.id;
                  const takenElsewhere = seats.some((s, j) => j !== i && s.profileId === p.id);
                  return (
                    <Tap
                      key={p.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on, disabled: takenElsewhere }}
                      accessibilityLabel={`${t('playerN', { n: i + 1 })}: ${p.name ?? t('you')}`}
                      disabled={takenElsewhere}
                      onPress={() => onChange(i, on ? { profileId: null } : { profileId: p.id, name: p.name })}
                      style={[styles.profileChip, on && styles.profileChipOn, takenElsewhere && styles.profileChipOff]}
                    >
                      <View style={[styles.dot, { backgroundColor: p.color }]} />
                      <Text style={[styles.profileChipText, on && styles.profileChipTextOn]} numberOfLines={1}>
                        {p.name ?? t('you')}
                      </Text>
                    </Tap>
                  );
                })}
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              value={seat.name ?? ''}
              placeholder={t('playerN', { n: i + 1 })}
              placeholderTextColor={colors.muted}
              onChangeText={(text) => onChange(i, { name: text.trim() ? text : null, profileId: null })}
              maxLength={16}
              accessibilityLabel={t('playerN', { n: i + 1 })}
            />
          </View>
        ))}
        <Button variant="lime" label={t('continue')} onPress={() => setNaming(false)} />
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  chip: { height: 50, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 14, borderWidth: 1.5 },
  chipHuman: { backgroundColor: colors.surface, borderColor: colors.ink },
  chipBot: { backgroundColor: 'transparent', borderColor: colors.line },
  pressed: { opacity: 0.7 },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  seatForm: { gap: 6 },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 32, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  profileChipOn: { borderColor: colors.ink, backgroundColor: colors.lime },
  profileChipOff: { opacity: 0.4 },
  profileChipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, maxWidth: 120 },
  profileChipTextOn: { color: colors.ink },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  kind: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  kindBot: { color: colors.muted },
  namesButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  namesText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
  input: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
});
