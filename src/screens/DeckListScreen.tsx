import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardArt } from '../ui/CardArt';
import { CardImage } from '../ui/CardImage';
import { LanguageToggle } from '../ui/LanguageToggle';
import { Screen } from '../ui/Screen';
import { deckTheme, fonts, MAX_WIDTH, radius } from '../ui/theme';

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
                <CardArt deckId={d.id} cardId={d.cards[0].id} width={tile * 0.56} style={styles.back2} />
                <CardImage source={pageImage(d.id, d.cover.page)} width={tile * 0.56} style={styles.front} />
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
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23 },
  sub: { fontFamily: fonts.semibold, fontSize: 12, opacity: 0.85 },
  cardWrap: { height: 150, marginTop: 10, alignItems: 'center', justifyContent: 'flex-end' },
  back2: { position: 'absolute', bottom: -30, right: 0, transform: [{ rotate: '12deg' }] },
  front: { position: 'absolute', bottom: -40, left: 4, transform: [{ rotate: '-6deg' }], borderRadius: radius.card },
});
