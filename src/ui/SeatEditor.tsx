import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useI18n } from '../i18n';
import { SeatConfig } from '../navigation';
import { Segmented } from './Segmented';
import { colors, radius } from './theme';

interface Props {
  seats: SeatConfig[];
  onChange: (index: number, patch: Partial<SeatConfig>) => void;
  /** Team number per seat, when playing in teams. */
  teams?: number[];
}

/** One row per seat: an optional name and whether a person or the phone plays it. */
export function SeatEditor({ seats, onChange, teams }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.seats}>
      {seats.map((seat, i) => (
        <View key={i} style={styles.seat}>
          {teams ? (
            <View style={[styles.teamDot, { backgroundColor: colors.teams[teams[i]] }]}>
              <Text style={styles.teamDotText}>{teams[i] + 1}</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.name}
            value={seat.name ?? ''}
            placeholder={t('playerN', { n: i + 1 })}
            placeholderTextColor={colors.muted}
            onChangeText={(text) => onChange(i, { name: text.trim() ? text : null })}
            maxLength={16}
            accessibilityLabel={t('playerN', { n: i + 1 })}
          />
          <View style={styles.kind}>
            <Segmented
              options={[
                { value: 'human' as const, label: t('person') },
                { value: 'bot' as const, label: t('phone') },
              ]}
              value={seat.kind}
              onChange={(kind) => onChange(i, { kind })}
              label={(v) => `${t('playerN', { n: i + 1 })}: ${v === 'human' ? t('person') : t('phone')}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Six seats: the first played by a person, the rest by the phone. */
export function defaultSeats(): SeatConfig[] {
  return Array.from({ length: 6 }, (_, i) => ({ kind: i === 0 ? 'human' : 'bot', name: null }));
}

const styles = StyleSheet.create({
  seats: { gap: 10 },
  seat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kind: { width: 184 },
  teamDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  teamDotText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  name: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.ink,
  },
});
