import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardImage } from '../ui/CardImage';
import { Screen } from '../ui/Screen';
import { colors, MAX_WIDTH } from '../ui/theme';

export function DeckListScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width, MAX_WIDTH) - 32 - 16) / 2;
  return (
    <Screen title={t('decks')} onBack={nav.pop} backLabel={t('back')}>
      <View style={styles.grid}>
        {DECKS.map((d) => (
          <Pressable key={d.id} accessibilityRole="button" onPress={() => nav.push({ name: 'deck', deckId: d.id })}>
            <CardImage source={pageImage(d.id, d.cover.page)} width={cardWidth} />
            <Text style={styles.title}>{d.title}</Text>
            {d.subtitle ? <Text style={styles.subtitle}>{d.subtitle}</Text> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  title: { marginTop: 8, fontSize: 16, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
});
