import { useState } from 'react';
import { Text, View } from 'react-native';
import { HAND_SIZES, MAX_PLAYERS, MIN_PLAYERS } from '../game/matatu';
import { SUITED_DECKS } from '../decks';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { DeckPicker } from '../ui/DeckPicker';
import { Screen, formStyles } from '../ui/Screen';
import { SeatEditor, defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

export function MatatuSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const [deckId, setDeckId] = useState(SUITED_DECKS[0].id);
  const [playerCount, setPlayerCount] = useState(2);
  const [handSize, setHandSize] = useState<number>(7);
  const [seats, setSeats] = useState<SeatConfig[]>(defaultSeats);

  const active = seats.slice(0, playerCount);
  const hasHuman = active.some((s) => s.kind === 'human');
  const updateSeat = (i: number, patch: Partial<SeatConfig>) =>
    setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Screen
      title="Matatu"
      onBack={nav.pop}
      backLabel={t('back')}
      footer={
        <View style={{ gap: 8 }}>
          {!hasHuman ? <Text style={formStyles.warning}>{t('needOnePerson')}</Text> : null}
          <Button
            label={t('start')}
            disabled={!hasHuman}
            onPress={() => nav.push({ name: 'matatuGame', config: { deckId, handSize, seats: active } })}
          />
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

      <Text style={formStyles.section}>{t('cardsEach')}</Text>
      <Segmented
        options={HAND_SIZES.map((n) => ({ value: n as number, label: String(n) }))}
        value={handSize}
        onChange={setHandSize}
        label={(n) => `${t('cardsEach')}: ${n}`}
      />

      <Text style={formStyles.section}>{t('whoPlays')}</Text>
      <SeatEditor seats={active} onChange={updateSeat} />
    </Screen>
  );
}
