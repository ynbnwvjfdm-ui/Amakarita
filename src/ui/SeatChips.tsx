import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '../i18n';
import { SeatConfig } from '../navigation';
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

/**
 * One small tile per player, three to a row: tap a tile to switch between a
 * person and the phone. Names are written in a separate panel so the form
 * stays on one screen.
 */
export function SeatChips({ seats, onChange, width, peopleOnly, title }: Props) {
  const { t } = useI18n();
  const [naming, setNaming] = useState(false);
  const perRow = Math.min(3, Math.max(1, seats.length));
  const chipW = Math.floor((width - GAP * (perRow - 1)) / perRow);
  const kindLabel = (s: SeatConfig) => (s.kind === 'human' ? t('person') : t('phone'));

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[formStyles.sectionTight, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setNaming(true)} style={styles.namesButton} hitSlop={8}>
          <Ionicons name="create-outline" size={16} color={colors.ink} />
          <Text style={styles.namesText}>{t('writeNames')}</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {seats.map((seat, i) => {
          const human = peopleOnly || seat.kind === 'human';
          const name = seat.name ?? t('playerN', { n: i + 1 });
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`${name}: ${human ? t('person') : t('phone')}`}
              disabled={peopleOnly}
              onPress={() => onChange(i, { kind: seat.kind === 'human' ? 'bot' : 'human' })}
              style={({ pressed }) => [styles.chip, { width: chipW }, human ? styles.chipHuman : styles.chipBot, pressed && styles.pressed]}
            >
              <Ionicons name={human ? 'person' : 'phone-portrait-outline'} size={20} color={human ? colors.ink : colors.muted} />
              <View style={styles.texts}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.kind, !human && styles.kindBot]} numberOfLines={1}>
                  {peopleOnly ? t('person') : kindLabel(seat)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Panel visible={naming} title={t('writeNames')} onRequestClose={() => setNaming(false)}>
        {seats.map((seat, i) => (
          <TextInput
            key={i}
            style={styles.input}
            value={seat.name ?? ''}
            placeholder={t('playerN', { n: i + 1 })}
            placeholderTextColor={colors.muted}
            onChangeText={(text) => onChange(i, { name: text.trim() ? text : null })}
            maxLength={16}
            accessibilityLabel={t('playerN', { n: i + 1 })}
          />
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
  chip: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1.5 },
  chipHuman: { backgroundColor: colors.surface, borderColor: colors.ink },
  chipBot: { backgroundColor: 'transparent', borderColor: colors.line },
  pressed: { opacity: 0.7 },
  texts: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  kind: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
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
