import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Tap } from './fx';
import { CARD_RATIO, SUITED_DECKS } from '../decks';
import { CardImage } from './CardImage';
import { colors, fonts, MAX_WIDTH } from './theme';

interface Props {
  value: string;
  onChange: (deckId: string) => void;
  /** Adds an "all decks" choice first, with this title. */
  mixTitle?: string;
}

const COLS = 3;
const GAP = 10;

/** The suited decks in rows of three, every cover fully in view. */
export function DeckPicker({ value, onChange, mixTitle }: Props) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((Math.min(width, MAX_WIDTH) - 32 - GAP * (COLS - 1)) / COLS);
  const cardW = cell - 16;
  const choices = [...(mixTitle ? [{ id: 'mix', title: mixTitle }] : []), ...SUITED_DECKS.map((d) => ({ id: d.id, title: d.title }))];

  return (
    <View style={styles.grid}>
      {choices.map((c) => {
        const on = c.id === value;
        return (
          <Tap
            key={c.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={c.title}
            onPress={() => onChange(c.id)}
            style={[styles.deck, { width: cell }, on && styles.deckOn]}
          >
            {c.id === 'mix' ? <AllDecks width={cardW} /> : <CardImage deckId={c.id} page={SUITED_DECKS.find((d) => d.id === c.id)!.cover.page} width={cardW} />}
            <Text style={styles.deckTitle} numberOfLines={1}>
              {c.title}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

/** Five small covers side by side in two rows, in the space of one card. */
function AllDecks({ width }: { width: number }) {
  const gap = 4;
  const mini = (width - gap * 2) / 3;
  return (
    <View style={[styles.all, { width, height: width / CARD_RATIO, gap }]}>
      {SUITED_DECKS.map((d) => (
        <CardImage key={d.id} deckId={d.id} page={d.cover.page} width={mini} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  deck: { padding: 6, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  deckOn: { borderColor: colors.ink, backgroundColor: colors.surface },
  all: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center' },
  deckTitle: { marginTop: 6, fontSize: 12, fontFamily: fonts.semibold, color: colors.ink, alignSelf: 'stretch', textAlign: 'center' },
});
