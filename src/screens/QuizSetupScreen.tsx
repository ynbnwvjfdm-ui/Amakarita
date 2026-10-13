import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { ATTEMPT_CHOICES, QuizMode } from '../game/quiz';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { DeckPicker } from '../ui/DeckPicker';
import { Screen, formStyles } from '../ui/Screen';
import { SeatChips } from '../ui/SeatChips';
import { defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';
import { MAX_WIDTH } from '../ui/theme';

/** Two steps: the deck, then everything else on one screen. */
export function QuizSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<1 | 2>(1);
  const [deckId, setDeckId] = useState('mix');
  const [mode, setMode] = useState<QuizMode>('phone');
  const [playerCount, setPlayerCount] = useState(2);
  const [attempts, setAttempts] = useState(ATTEMPT_CHOICES[1]);
  const [seats, setSeats] = useState<SeatConfig[]>(defaultSeats);

  // Asking each other out loud needs people in every seat.
  const active = seats.slice(0, playerCount).map((s) => (mode === 'group' ? { ...s, kind: 'human' as const } : s));
  const hasHuman = active.some((s) => s.kind === 'human');
  const updateSeat = (i: number, patch: Partial<SeatConfig>) =>
    setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  if (step === 1) {
    return (
      <Screen key="deck" compact title="Amakarita" onBack={nav.pop} backLabel={t('back')} footer={<Button label={t('continue')} onPress={() => setStep(2)} />}>
        <Text style={formStyles.section}>{t('chooseDeck')}</Text>
        <DeckPicker value={deckId} onChange={setDeckId} mixTitle={t('mix')} />
      </Screen>
    );
  }

  return (
    <Screen
      key="settings"
      compact
      title="Amakarita"
      onBack={() => setStep(1)}
      backLabel={t('back')}
      footer={
        <View style={{ gap: 8 }}>
          {!hasHuman ? <Text style={formStyles.warning}>{t('needOnePerson')}</Text> : null}
          <Button
            label={t('start')}
            disabled={!hasHuman}
            onPress={() => nav.push({ name: 'quizGame', config: { deckId, mode, attempts, seats: active } })}
          />
        </View>
      }
    >
      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('howToAnswer')}</Text>
        <Segmented
          options={[
            { value: 'phone' as QuizMode, label: t('modePhone') },
            { value: 'group' as QuizMode, label: t('modeGroup') },
          ]}
          value={mode}
          onChange={setMode}
          label={(v) => (v === 'phone' ? t('modePhone') : t('modeGroup'))}
        />
        <Text style={formStyles.note}>{mode === 'phone' ? t('modePhoneNote') : t('modeGroupNote')}</Text>
      </View>

      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('players')}</Text>
        <Segmented
          options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
          value={playerCount}
          onChange={setPlayerCount}
          label={(n) => `${n} ${t('players')}`}
        />
      </View>

      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('attempts')}</Text>
        <Segmented
          options={ATTEMPT_CHOICES.map((n) => ({ value: n, label: String(n) }))}
          value={attempts}
          onChange={setAttempts}
          label={(n) => t('attemptsN', { n })}
        />
        <Text style={formStyles.note}>{t('attemptsNote')}</Text>
      </View>

      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('whoPlays')}</Text>
        <SeatChips seats={active} onChange={updateSeat} width={Math.min(width, MAX_WIDTH) - 32} peopleOnly={mode === 'group'} />
      </View>
    </Screen>
  );
}
