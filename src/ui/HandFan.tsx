import { Pressable, StyleSheet, View } from 'react-native';
import { CARD_RATIO } from '../decks';
import { ArtRef, CardArt } from './CardArt';

interface Props {
  deckId: string;
  cards: { id: string; label: string }[];
  /** Room available across. */
  width: number;
  cardWidth: number;
  onPress: (id: string) => void;
}

/** A hand held in a fan: evenly spaced, slightly turned, every corner visible. */
export function HandFan({ deckId, cards, width, cardWidth, onPress }: Props) {
  const n = cards.length;
  const cardH = cardWidth / CARD_RATIO;
  const spread = n > 1 ? Math.min(26, n * 4) : 0; // degrees from first to last card
  // Keep room at the sides for the outer cards' tilt.
  const room = width - cardWidth - cardH * Math.sin((spread / 2) * (Math.PI / 180)) - 8;
  const step = n > 1 ? Math.min(cardWidth * 0.7, Math.max(10, room / (n - 1))) : 0;
  const span = cardWidth + step * (n - 1);
  const lift = 16; // how much lower the outer cards sit

  return (
    <View style={{ width: span, height: cardH + lift + 8, alignSelf: 'center' }}>
      {cards.map((c, i) => {
        const t = n > 1 ? i / (n - 1) - 0.5 : 0; // -0.5 … 0.5
        const art: ArtRef = { deckId, cardId: c.id };
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={c.label}
            onPress={() => onPress(c.id)}
            style={({ pressed }) => [
              styles.card,
              {
                left: i * step,
                top: 4 + t * t * 4 * lift,
                transform: [{ rotate: `${t * spread}deg` }, { translateY: pressed ? -10 : 0 }],
              },
            ]}
          >
            <CardArt {...art} width={cardWidth} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute' },
});
