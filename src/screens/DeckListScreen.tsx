import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { countKnown } from '../game/progress';
import { useNav } from '../navigation';
import { useProgress } from '../progressStore';
import { QUESTIONS } from '../questions';
import { CardImage } from '../ui/CardImage';
import { Screen } from '../ui/Screen';
import { deckTheme, fonts, MAX_WIDTH } from '../ui/theme';
import { HeaderActions } from '../ui/Profiles';

/** The six decks, each on a block of its own colour. */
export function DeckListScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const tile = (Math.min(width, MAX_WIDTH) - 32 - 12) / 2;
  const { progress } = useProgress();
  return (
    <Screen tabbed title={t('tabDecks')} right={<HeaderActions />}>
      <View style={styles.grid}>
        {DECKS.map((d) => {
          const theme = deckTheme(d.id);
          const asked = d.cards.filter((c) => QUESTIONS[c.id]).map((c) => c.id);
          const known = countKnown(progress, asked);
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
              {/* An even height for every tile; decks without questions leave the line empty. */}
              <View style={styles.progressRow}>
                {asked.length ? (
                  <>
                    <View style={[styles.track, { backgroundColor: `${theme.onBase}33` }]}>
                      <View style={[styles.fill, { width: `${(known / asked.length) * 100}%`, backgroundColor: theme.onBase }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.onBase }]}>
                      {known}/{asked.length}
                    </Text>
                  </>
                ) : null}
              </View>
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
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 18, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  progressText: { fontFamily: fonts.bold, fontSize: 12 },
});
