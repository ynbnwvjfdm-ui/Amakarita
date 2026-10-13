import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SUITED_DECKS, pageImage } from '../decks';
import { CardImage } from './CardImage';
import { colors, radius, fonts } from './theme';

/** Horizontal choice between the five suited decks. */
export function DeckPicker({ value, onChange }: { value: string; onChange: (deckId: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decks}>
      {SUITED_DECKS.map((d) => {
        const on = d.id === value;
        return (
          <Pressable
            key={d.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={d.title}
            onPress={() => onChange(d.id)}
            style={[styles.deck, on && styles.deckOn]}
          >
            <CardImage source={pageImage(d.id, d.cover.page)} width={84} />
            <Text style={styles.deckTitle} numberOfLines={1}>
              {d.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  decks: { gap: 10, paddingVertical: 2, paddingRight: 16 },
  deck: { padding: 6, borderRadius: radius.button, borderWidth: 2, borderColor: 'transparent' },
  deckOn: { borderColor: colors.accent, backgroundColor: colors.surface },
  deckTitle: { marginTop: 6, fontSize: 12, fontFamily: fonts.semibold, color: colors.ink, width: 84, textAlign: 'center' },
});
