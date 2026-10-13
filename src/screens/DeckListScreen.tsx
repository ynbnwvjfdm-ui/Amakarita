import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardImage } from '../ui/CardImage';
import { LanguageToggle } from '../ui/LanguageToggle';
import { Screen } from '../ui/Screen';
import { deckTheme, fonts, MAX_WIDTH } from '../ui/theme';

/** The six decks, each on a block of its own colour. */
export function DeckListScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const tile = (Math.min(width, MAX_WIDTH) - 32 - 12) / 2;
  return (
    <Screen tabbed title={t('tabDecks')} right={<LanguageToggle />}>
      <View style={styles.grid}>
        {DECKS.map((d) => {
          const theme = deckTheme(d.id);
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityLabel={d.title}
              onPress={() => nav.push({ name: 'deck', deckId: d.id })}
              style={({ pressed }) => [styles.tile, { width: tile, backgroundColor: theme.base }, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <Text style={[styles.title, { color: theme.onBase }]} numberOfLines={2}>
                {d.title}
              </Text>
              <Text style={[styles.sub, { color: theme.onBase }]}>{t('cardsCount', { n: d.cards.length })}</Text>
              <View style={styles.cardWrap}>
                <CardImage source={pageImage(d.id, d.cover.page)} width={tile * 0.56} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { borderRadius: 24, padding: 14, gap: 2, overflow: 'hidden' },
  // Room for two lines, so the cards line up across a row.
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23, minHeight: 46 },
  sub: { fontFamily: fonts.semibold, fontSize: 12, opacity: 0.85 },
  cardWrap: { marginTop: 12, alignItems: 'center' },
});
