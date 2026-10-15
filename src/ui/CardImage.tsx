import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { CARD_RATIO, pageEdge, pageImage } from '../decks';
import { cardShadowStyle, radius } from './theme';

interface Props {
  deckId: string;
  /** A page number, e.g. the deck's cover for a face-down card. */
  page: number;
  width: number;
  style?: ViewStyle;
}

/** A printed page (a cover or a card back) at a given width, keeping the printed proportions. */
export function CardImage({ deckId, page, width, style }: Props) {
  const height = width / CARD_RATIO;
  const r = Math.max(3, Math.round((radius.card * width) / 120));
  return (
    <View testID="card" style={[{ width, height, borderRadius: r }, cardShadowStyle(width, pageEdge(deckId, page)), style]}>
      {/* Clipped, over the page's own edge colour, so no rim shows round the corners. */}
      <View style={[styles.clip, { borderRadius: r }]}>
        <Image source={pageImage(deckId, page)} style={{ width, height }} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
});
