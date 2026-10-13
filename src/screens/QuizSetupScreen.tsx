import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QuizMode } from '../game/quiz';
import { SUITED_DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { SeatConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { Screen, formStyles } from '../ui/Screen';
import { SeatEditor, defaultSeats } from '../ui/SeatEditor';
import { Segmented } from '../ui/Segmented';
import { colors, fonts, radius } from '../ui/theme';

const TARGETS = [50, 100, 150];

export function QuizSetupScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const [deckId, setDeckId] = useState('mix');
  const [mode, setMode] = useState<QuizMode>('phone');
  const [playerCount, setPlayerCount] = useState(2);
  const [target, setTarget] = useState(100);
  const [seats, setSeats] = useState<SeatConfig[]>(defaultSeats);

  // Asking each other out loud needs people in every seat.
  const active = seats.slice(0, playerCount).map((s) => (mode === 'group' ? { ...s, kind: 'human' as const } : s));
  const hasHuman = active.some((s) => s.kind === 'human');
  const updateSeat = (i: number, patch: Partial<SeatConfig>) =>
    setSeats((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const choices = [{ id: 'mix', title: t('mix') }, ...SUITED_DECKS.map((d) => ({ id: d.id, title: d.title }))];

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
          onPress={() => nav.push({ name: 'quizGame', config: { deckId, mode, target, seats: active } })}
        />
      }
    >
      <Text style={formStyles.section}>{t('chooseDeck')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decks} style={{ marginHorizontal: -16 }}>
        {choices.map((c) => {
          const on = c.id === deckId;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={c.title}
              onPress={() => setDeckId(c.id)}
              style={[styles.deck, on && styles.deckOn]}
            >
              {c.id === 'mix' ? (
                <View style={styles.fan}>
                  {SUITED_DECKS.map((d, i) => (
                    <CardImage
                      key={d.id}
                      source={pageImage(d.id, d.cover.page)}
                      width={60}
                      style={{ position: 'absolute', left: 6 + i * 6, top: 4, transform: [{ rotate: `${(i - 2) * 9}deg` }] }}
                    />
                  ))}
                </View>
              ) : (
                <CardImage source={pageImage(c.id, SUITED_DECKS.find((d) => d.id === c.id)!.cover.page)} width={84} />
              )}
              <Text style={styles.deckTitle} numberOfLines={1}>
                {c.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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

      <Text style={formStyles.section}>{t('target')}</Text>
      <Segmented
        options={TARGETS.map((n) => ({ value: n, label: String(n) }))}
        value={target}
        onChange={setTarget}
        label={(n) => t('targetPoints', { n })}
      />

      <Text style={formStyles.section}>{t('whoPlays')}</Text>
      <SeatEditor seats={active} onChange={updateSeat} peopleOnly={mode === 'group'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  decks: { gap: 10, paddingVertical: 2, paddingHorizontal: 16 },
  deck: { padding: 6, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  deckOn: { borderColor: colors.ink, backgroundColor: colors.surface },
  fan: { width: 84, height: 115 },
  deckTitle: { marginTop: 6, fontSize: 12, fontFamily: fonts.semibold, color: colors.ink, width: 84, textAlign: 'center', borderRadius: radius.pill },
});
