import { useState } from 'react';
import { Text } from 'react-native';
import { ATTEMPT_CHOICES, QuizMode } from '../game/quiz';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { DeckPicker } from '../ui/DeckPicker';
import { Screen, formStyles } from '../ui/Screen';
import { SeatEditor, defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';


export function QuizSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
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

  return (
    <Screen
      title="Amakarita"
      eyebrow={t('quizTagline')}
      onBack={nav.pop}
      backLabel={t('back')}
      footer={
        <Button
          label={t('start')}
          disabled={!hasHuman}
          onPress={() => nav.push({ name: 'quizGame', config: { deckId, mode, attempts, seats: active } })}
        />
      }
    >
      <Text style={formStyles.section}>{t('chooseDeck')}</Text>
      <DeckPicker value={deckId} onChange={setDeckId} mixTitle={t('mix')} />

      <Text style={formStyles.section}>{t('howToAnswer')}</Text>
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

      <Text style={formStyles.section}>{t('players')}</Text>
      <Segmented
        options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
        value={playerCount}
        onChange={setPlayerCount}
        label={(n) => `${n} ${t('players')}`}
      />

      <Text style={formStyles.section}>{t('attempts')}</Text>
      <Segmented
        options={ATTEMPT_CHOICES.map((n) => ({ value: n, label: String(n) }))}
        value={attempts}
        onChange={setAttempts}
        label={(n) => t('attemptsN', { n })}
      />
      <Text style={formStyles.note}>{t('attemptsNote')}</Text>

      <Text style={formStyles.section}>{t('whoPlays')}</Text>
      <SeatEditor seats={active} onChange={updateSeat} peopleOnly={mode === 'group'} />
    </Screen>
  );
}
