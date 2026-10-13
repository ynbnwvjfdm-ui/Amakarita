import { Pressable, StyleSheet, View } from 'react-native';
import { CARD_RATIO } from '../decks';
import { CardArt } from './CardArt';
import { HAND_GAP, handLayout } from './layout';

interface Props {
  deckId: string;
  cards: { id: string; label: string }[];
  /** The space the hand may use. */
  width: number;
  height: number;
  maxCardWidth: number;
  onPress: (id: string) => void;
}

/** The hand in neat rows: every card whole, none on top of another. */
export function HandGrid({ deckId, cards, width, height, maxCardWidth, onPress }: Props) {
  if (width <= 0 || height <= 0) return null;
  const { cardWidth, cols } = handLayout(cards.length, width, height, maxCardWidth, CARD_RATIO);
  const rowWidth = cols * cardWidth + HAND_GAP * (cols - 1);
  return (
    <View style={[styles.grid, { width: rowWidth }]}>
      {cards.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={c.label}
          onPress={() => onPress(c.id)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <CardArt deckId={deckId} cardId={c.id} width={cardWidth} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: HAND_GAP, alignSelf: 'center' },
  pressed: { opacity: 0.75 },
});
