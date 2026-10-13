import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native';
import { CARD_RATIO } from '../decks';
import { cardShadow, radius } from './theme';

interface Props {
  source: ImageSourcePropType;
  width: number;
  style?: ViewStyle;
}

/** A card face or back at a given width, keeping the printed proportions. */
export function CardImage({ source, width, style }: Props) {
  const height = width / CARD_RATIO;
  const r = Math.max(3, Math.round((radius.card * width) / 120));
  return (
    <View testID="card" style={[{ width, height, borderRadius: r, boxShadow: cardShadow(width) }, style]}>
      {/* Clipped with no background of its own, so no light edge shows round the corners. */}
      <View style={[styles.clip, { borderRadius: r }]}>
        <Image source={source} style={{ width, height }} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
});
