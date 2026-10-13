import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlayerCount, TeamMode, teamsFor } from '../game/amaturufu';
import { SUITED_DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { Screen } from '../ui/Screen';
import { colors, radius } from '../ui/theme';

const COUNTS: PlayerCount[] = [2, 4, 6];
const MAX_SEATS = 6;

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentLabel, on && styles.segmentLabelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AmaturufuSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const [deckId, setDeckId] = useState(SUITED_DECKS[0].id);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [sixMode, setSixMode] = useState<TeamMode>('teams');
  const [seats, setSeats] = useState<SeatConfig[]>(() =>
    Array.from({ length: MAX_SEATS }, (_, i) => ({ kind: i === 0 ? 'human' : 'bot', name: null })),
  );

  const teamMode: TeamMode = playerCount === 4 ? 'teams' : playerCount === 6 ? sixMode : 'solo';
  const teams = teamsFor(playerCount, teamMode);
  const active = seats.slice(0, playerCount);
  const hasHuman = active.some((s) => s.kind === 'human');

  const updateSeat = (i: number, patch: Partial<SeatConfig>) =>
    setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const start = () =>
    nav.push({ name: 'amaturufuGame', config: { deckId, playerCount, teamMode, seats: active } });

  return (
    <Screen
      title="Amaturufu"
      onBack={nav.pop}
      backLabel={t('back')}
      footer={
        <View style={{ gap: 8 }}>
          {!hasHuman ? <Text style={styles.warning}>{t('needOnePerson')}</Text> : null}
          <Button label={t('start')} onPress={start} disabled={!hasHuman} />
        </View>
      }
    >
      <Text style={styles.section}>{t('chooseDeck')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decks}>
        {SUITED_DECKS.map((d) => {
          const on = d.id === deckId;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={d.title}
              onPress={() => setDeckId(d.id)}
              style={[styles.deck, on && styles.deckOn]}
            >
              <CardImage source={pageImage(d.id, d.cover.page)} width={84} />
              <Text style={styles.deckTitle} numberOfLines={1}>
                {d.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.section}>{t('players')}</Text>
      <Segmented
        options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
        value={playerCount}
        onChange={setPlayerCount}
        label={(n) => `${n} ${t('players')}`}
      />
      {playerCount === 4 ? <Text style={styles.note}>{t('teamsNote4')}</Text> : null}
      {playerCount === 6 ? (
        <>
          <Text style={styles.note}>{t('howToPlay6')}</Text>
          <Segmented
            options={[
              { value: 'teams' as TeamMode, label: t('teamsOf3') },
              { value: 'solo' as TeamMode, label: t('everyoneAlone') },
            ]}
            value={sixMode}
            onChange={setSixMode}
            label={(v) => (v === 'teams' ? t('teamsOf3') : t('everyoneAlone'))}
          />
        </>
      ) : null}

      <Text style={styles.section}>{t('whoPlays')}</Text>
      <View style={styles.seats}>
        {active.map((seat, i) => (
          <View key={i} style={styles.seat}>
            {teamMode === 'teams' ? (
              <View style={[styles.teamDot, { backgroundColor: colors.teams[teams[i]] }]}>
                <Text style={styles.teamDotText}>{teams[i] + 1}</Text>
              </View>
            ) : null}
            <TextInput
              style={styles.name}
              value={seat.name ?? ''}
              placeholder={t('playerN', { n: i + 1 })}
              placeholderTextColor={colors.muted}
              onChangeText={(text) => updateSeat(i, { name: text.trim() ? text : null })}
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
              onChange={(kind) => updateSeat(i, { kind })}
              label={(v) => `${t('playerN', { n: i + 1 })}: ${v === 'human' ? t('person') : t('phone')}`}
            />
            </View>
          </View>
        ))}
      </View>
      {teamMode === 'teams' ? (
        <Text style={styles.note}>
          {t('team', { n: 1 })}: {teams.flatMap((tm, i) => (tm === 0 ? [active[i].name ?? t('playerN', { n: i + 1 })] : [])).join(', ')}
          {'\n'}
          {t('team', { n: 2 })}: {teams.flatMap((tm, i) => (tm === 1 ? [active[i].name ?? t('playerN', { n: i + 1 })] : [])).join(', ')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  note: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  warning: { fontSize: 14, color: colors.accent, textAlign: 'center' },
  decks: { gap: 10, paddingVertical: 2, paddingRight: 16 },
  deck: { padding: 6, borderRadius: radius.button, borderWidth: 2, borderColor: 'transparent' },
  deckOn: { borderColor: colors.accent, backgroundColor: colors.surface },
  deckTitle: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.ink, width: 84, textAlign: 'center' },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, padding: 3 },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 8 },
  segmentOn: { backgroundColor: colors.ink },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  segmentLabelOn: { color: colors.surface },
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
