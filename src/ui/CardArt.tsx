import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CARD_RATIO, DeckCard, getDeck, pageImage } from '../decks';
import { SUIT_SYMBOL } from './table';
import { cardShadow, deckTheme, fonts } from './theme';

/**
 * The part of a printed card that holds its words and pictures, as fractions
 * of the page, copied across untouched. Measured over all 270 suited cards:
 * the centre spans x 0.126–0.874, y 0.219–0.705. The old side labels poke
 * into that box at the top right (down to y 0.295) and bottom left (from
 * y 0.704), and the old corner suit's tip at the top left (x 0.134–0.155,
 * down to y 0.219). The centre is narrow there (x 0.27–0.73), so the copy
 * steps around them.
 */
export const CARD_CENTRE = [
  { left: 0.2, top: 0.214, right: 0.85, bottom: 0.3 },
  { left: 0.115, top: 0.3, right: 0.885, bottom: 0.703 },
  { left: 0.15, top: 0.703, right: 0.885, bottom: 0.712 },
];

/** The small vertical label printed on each deck's cards. */
const SIDE_LABEL: Record<string, string> = {
  'ntibavuga-bavuga': 'IMIKORESHEREZE INOZE',
  ikeshamvugo: 'IKESHAMVUGO',
  imvugo: 'IMVUGO',
  kirazira: 'KIRAZIRA',
  indangagaciro: 'INDANGAGACIRO',
};

export interface ArtRef {
  deckId: string;
  /** A card id, or a page number for covers and other pages. */
  cardId?: string;
  page?: number;
}

interface Props extends ArtRef {
  width: number;
  style?: ViewStyle;
}

function findCard(ref: ArtRef): { card: DeckCard | undefined; page: number } {
  const deck = getDeck(ref.deckId);
  const card = ref.cardId ? deck.cards.find((c) => c.id === ref.cardId) : deck.cards.find((c) => c.page === ref.page);
  return { card, page: card?.page ?? ref.page ?? deck.cover.page };
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * A card face. Suited cards and jokers get the app's frame (corners, label)
 * around their original centre; covers, backs and riddle cards are shown as
 * printed.
 */
export function CardArt({ width, style, ...ref }: Props) {
  const { card, page } = findCard(ref);
  const height = width / CARD_RATIO;
  const s = width / 300;
  const source = pageImage(ref.deckId, page);
  const redesign = card && (card.kind === 'joker' || (card.rank && card.suit)) && SIDE_LABEL[ref.deckId];
  const radius = 16 * s;

  if (!redesign || !card) {
    return (
      <View testID="card" style={[{ width, height, borderRadius: radius, boxShadow: cardShadow(width) }, style]}>
        <View style={[styles.clip, { borderRadius: radius }]}>
          <Image source={source} style={{ width, height }} resizeMode="cover" />
        </View>
      </View>
    );
  }

  const theme = deckTheme(ref.deckId);
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  const joker = card.kind === 'joker';
  // The dark joker goes on black cards, the coloured one on red: show which is which.
  const cornerColor = joker ? (card.id.endsWith('joker2') ? theme.accent : theme.ink) : red ? theme.accent : theme.ink;

  // Corners a little larger on small cards, so the number stays readable in a hand.
  const c = s * (width < 200 ? 1.2 : 1);
  const corner = joker ? (
    <Text style={[styles.joker, { color: cornerColor, fontSize: 21 * c, letterSpacing: 1 * c }]}>JOKER</Text>
  ) : (
    <View style={styles.cornerCol}>
      <Text style={[styles.rank, { color: cornerColor, fontSize: 34 * c, lineHeight: 36 * c, letterSpacing: -1.5 * c }]}>{card.rank}</Text>
      {/* A clear gap, so the suit never touches the number or letter above it. */}
      <Text style={[styles.suit, { color: cornerColor, fontSize: 24 * c, lineHeight: 26 * c, marginTop: 6 * c }]}>{SUIT_SYMBOL[card.suit!]}</Text>
    </View>
  );

  return (
    <View testID="card" style={[{ width, height, borderRadius: radius, boxShadow: cardShadow(width) }, style]}>
      <View style={[styles.clip, { borderRadius: radius, backgroundColor: theme.face }]}>
      <View
        style={[
          styles.frame,
          { top: 7 * s, left: 7 * s, right: 7 * s, bottom: 7 * s, borderRadius: radius - 6 * s, borderWidth: Math.max(1, 1.2 * s), borderColor: withAlpha(theme.ink, 0.16) },
        ]}
      />
      {/* The printed centre, in exactly its original place. */}
      {CARD_CENTRE.map((c, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: c.left * width,
            top: c.top * height,
            width: (c.right - c.left) * width,
            height: (c.bottom - c.top) * height,
            overflow: 'hidden',
          }}
        >
          <Image source={source} style={{ position: 'absolute', left: -c.left * width, top: -c.top * height, width, height }} resizeMode="cover" />
        </View>
      ))}
      <View style={[styles.corner, { top: 15 * s, left: 16 * s }]}>{corner}</View>
      <View style={[styles.corner, { bottom: 15 * s, right: 16 * s, transform: [{ rotate: '180deg' }] }]}>{corner}</View>
      <View style={[styles.pill, { top: 16 * s, right: 16 * s, backgroundColor: theme.base, paddingHorizontal: 8 * s, paddingVertical: 3 * s, borderRadius: 20 * s }]}>
        <Text style={[styles.pillText, { color: theme.onBase, fontSize: 8.5 * s }]} numberOfLines={1}>
          {getDeck(ref.deckId).title.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.label, { bottom: 20 * s, left: 18 * s, fontSize: 7.5 * s, letterSpacing: 1.2 * s, color: withAlpha(theme.ink, 0.55) }]} numberOfLines={1}>
        {SIDE_LABEL[ref.deckId]}
      </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Clips the face to the rounded corners; the shadow lives on the parent.
  clip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  frame: { position: 'absolute' },
  corner: { position: 'absolute' },
  cornerCol: { alignItems: 'center' },
  rank: { fontFamily: fonts.display },
  suit: { fontFamily: fonts.display },
  joker: { fontFamily: fonts.display },
  pill: { position: 'absolute', maxWidth: '52%' },
  pillText: { fontFamily: fonts.bold, letterSpacing: 0.4 },
  label: { position: 'absolute', fontFamily: fonts.semibold, maxWidth: '55%' },
});
