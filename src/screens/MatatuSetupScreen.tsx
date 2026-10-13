import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { HAND_SIZES, MAX_PLAYERS, MIN_PLAYERS } from '../game/matatu';
import { SUITED_DECKS } from '../decks';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { DeckPicker } from '../ui/DeckPicker';
import { Screen, formStyles } from '../ui/Screen';
import { SeatChips } from '../ui/SeatChips';
import { defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';
import { MAX_WIDTH } from '../ui/theme';

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

/** Two steps: the deck, then everything else on one screen. */
export function MatatuSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<1 | 2>(1);
  const [deckId, setDeckId] = useState(SUITED_DECKS[0].id);
  const [playerCount, setPlayerCount] = useState(2);
  const [handSize, setHandSize] = useState<number>(7);
  const [seats, setSeats] = useState<SeatConfig[]>(defaultSeats);

  const active = seats.slice(0, playerCount);
  const hasHuman = active.some((s) => s.kind === 'human');
  const updateSeat = (i: number, patch: Partial<SeatConfig>) =>
    setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  if (step === 1) {
    return (
      <Screen key="deck" compact title="Matatu" onBack={nav.pop} backLabel={t('back')} footer={<Button label={t('continue')} onPress={() => setStep(2)} />}>
        <Text style={formStyles.section}>{t('chooseDeck')}</Text>
        <DeckPicker value={deckId} onChange={setDeckId} />
      </Screen>
    );
  }

  return (
    <Screen
      key="settings"
      compact
      title="Matatu"
      onBack={() => setStep(1)}
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
      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('players')}</Text>
        <Segmented
          options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
          value={playerCount}
          onChange={setPlayerCount}
          label={(n) => `${n} ${t('players')}`}
        />
      </View>

      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('cardsEach')}</Text>
        <Segmented
          options={HAND_SIZES.map((n) => ({ value: n as number, label: String(n) }))}
          value={handSize}
          onChange={setHandSize}
          label={(n) => `${t('cardsEach')}: ${n}`}
        />
      </View>

      <SeatChips title={t('whoPlays')} seats={active} onChange={updateSeat} width={Math.min(width, MAX_WIDTH) - 32} />
    </Screen>
  );
}
