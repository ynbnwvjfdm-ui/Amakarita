import { useState } from 'react';
import { Text, View } from 'react-native';
import { PlayerCount, TeamMode, teamsFor } from '../game/amaturufu';
import { SUITED_DECKS } from '../decks';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { DeckPicker } from '../ui/DeckPicker';
import { Screen, formStyles } from '../ui/Screen';
import { SeatEditor, defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';

const COUNTS: PlayerCount[] = [2, 4, 6];

export function AmaturufuSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const [deckId, setDeckId] = useState(SUITED_DECKS[0].id);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [sixMode, setSixMode] = useState<TeamMode>('teams');
  const [seats, setSeats] = useState<SeatConfig[]>(defaultSeats);

  const teamMode: TeamMode = playerCount === 4 ? 'teams' : playerCount === 6 ? sixMode : 'solo';
  const teams = teamsFor(playerCount, teamMode);
  const active = seats.slice(0, playerCount);
  const hasHuman = active.some((s) => s.kind === 'human');
  const seatName = (i: number) => active[i].name ?? t('playerN', { n: i + 1 });

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
          {!hasHuman ? <Text style={formStyles.warning}>{t('needOnePerson')}</Text> : null}
          <Button label={t('start')} onPress={start} disabled={!hasHuman} />
        </View>
      }
    >
      <Text style={formStyles.section}>{t('chooseDeck')}</Text>
      <DeckPicker value={deckId} onChange={setDeckId} />

      <Text style={formStyles.section}>{t('players')}</Text>
      <Segmented
        options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
        value={playerCount}
        onChange={setPlayerCount}
        label={(n) => `${n} ${t('players')}`}
      />
      {playerCount === 4 ? <Text style={formStyles.note}>{t('teamsNote4')}</Text> : null}
      {playerCount === 6 ? (
        <>
          <Text style={formStyles.note}>{t('howToPlay6')}</Text>
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

      <Text style={formStyles.section}>{t('whoPlays')}</Text>
      <SeatEditor seats={active} onChange={updateSeat} teams={teamMode === 'teams' ? teams : undefined} />
      {teamMode === 'teams' ? (
        <Text style={formStyles.note}>
          {t('team', { n: 1 })}: {teams.flatMap((tm, i) => (tm === 0 ? [seatName(i)] : [])).join(', ')}
          {'\n'}
          {t('team', { n: 2 })}: {teams.flatMap((tm, i) => (tm === 1 ? [seatName(i)] : [])).join(', ')}
        </Text>
      ) : null}
    </Screen>
  );
}
