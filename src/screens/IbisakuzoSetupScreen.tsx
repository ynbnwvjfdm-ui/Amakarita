import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { ATTEMPT_CHOICES } from '../game/quiz';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { useProgress } from '../progressStore';
import { Button } from '../ui/Button';
import { HelpButton, HowToPlay, useGuide } from '../ui/HowToPlay';
import { Screen, formStyles } from '../ui/Screen';
import { SeatChips, seatsFor } from '../ui/SeatChips';
import { Segmented } from '../ui/Segmented';
import { MAX_WIDTH } from '../ui/theme';

/** One screen: how many riddles each, and the two people playing. */
export function IbisakuzoSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [attempts, setAttempts] = useState(ATTEMPT_CHOICES[0]);
  // The first person starts as whoever's profile is active; they ask first.
  const { active: me } = useProgress();
  const [seats, setSeats] = useState<SeatConfig[]>(() => seatsFor(me).slice(0, 2).map((s) => ({ ...s, kind: 'human' as const })));
  const updateSeat = (i: number, patch: Partial<SeatConfig>) => setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch, kind: 'human' } : s)));
  const guide = useGuide('ibisakuzo');
  const help = (
    <>
      <HelpButton onPress={guide.open} />
      <HowToPlay game="ibisakuzo" deckId="ibisakuzo" visible={guide.visible} onClose={guide.close} />
    </>
  );

  return (
    <Screen
      compact
      right={help}
      title="Ibisakuzo"
      onBack={nav.pop}
      backLabel={t('back')}
      footer={<Button label={t('start')} onPress={() => nav.push({ name: 'ibisakuzoGame', config: { attempts, seats } })} />}
    >
      <View style={formStyles.group}>
        <Text style={formStyles.sectionTight}>{t('attempts')}</Text>
        <Segmented
          options={ATTEMPT_CHOICES.map((n) => ({ value: n, label: String(n) }))}
          value={attempts}
          onChange={setAttempts}
          label={(n) => t('attemptsN', { n })}
        />
        <Text style={formStyles.note}>{t('riddleAttemptsNote')}</Text>
      </View>

      <SeatChips title={t('whoPlays')} seats={seats} onChange={updateSeat} width={Math.min(width, MAX_WIDTH) - 32} peopleOnly />
    </Screen>
  );
}
