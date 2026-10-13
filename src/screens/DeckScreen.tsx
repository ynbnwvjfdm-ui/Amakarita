import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { getDeck, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { Screen } from '../ui/Screen';
import { MAX_WIDTH } from '../ui/theme';

/** Every page of a deck, in print order. Tap a card to see it large. */
export function DeckScreen({ deckId }: { deckId: string }) {
  const { t } = useI18n();
  const nav = useNav();
  const deck = getDeck(deckId);
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<number | null>(null);
  const cardWidth = (Math.min(width, MAX_WIDTH) - 32 - 2 * 10) / 3;
  const pages = Array.from({ length: deck.pageCount }, (_, i) => i + 1);

  return (
    <Screen title={deck.title} onBack={nav.pop} backLabel={t('back')}>
      <View style={styles.grid}>
        {pages.map((p) => (
          <Pressable key={p} accessibilityRole="button" onPress={() => setOpen(p)}>
            <CardImage source={pageImage(deckId, p)} width={cardWidth} />
          </Pressable>
        ))}
      </View>
      <CardViewer source={open ? pageImage(deckId, open) : null} onClose={() => setOpen(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
