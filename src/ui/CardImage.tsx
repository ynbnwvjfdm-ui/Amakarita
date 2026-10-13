import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native';
import { CARD_RATIO } from '../decks';
import { radius } from './theme';

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
    <View style={[styles.shadow, { width, height, borderRadius: r }, style]}>
      <Image source={source} style={{ width, height, borderRadius: r }} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
