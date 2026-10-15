import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { greetingKey } from '../dates';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardOfDay } from '../ui/CardOfDay';
import { DeckCarousel } from '../ui/DeckCarousel';
import { GameTickets } from '../ui/GameTickets';
import { ProgressPanel } from '../ui/ProgressPanel';
import { Screen, formStyles } from '../ui/Screen';
import { colors, fonts, MAX_WIDTH } from '../ui/theme';
import { HeaderActions } from '../ui/Profiles';

export function HomeScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [now] = useState(() => new Date());
  const W = Math.min(width, MAX_WIDTH) - 32;

  return (
    <Screen tabbed eyebrow={t(greetingKey(now))} title={t('appTitle')} right={<HeaderActions />}>
      <Text style={styles.tagline}>{t('homeTagline')}</Text>
      <DeckCarousel width={W} onOpen={(deckId) => nav.push({ name: 'deck', deckId })} />
      <ProgressPanel onOpenDeck={(deckId) => nav.push({ name: 'deck', deckId })} onReview={() => nav.push({ name: 'review' })} />
      <CardOfDay width={W} />
      <Text style={formStyles.section}>{t('games')}</Text>
      <GameTickets />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tagline: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted, marginTop: -12 },
});
