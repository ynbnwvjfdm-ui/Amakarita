import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DECKS, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { CardImage } from '../ui/CardImage';
import { LanguageToggle } from '../ui/LanguageToggle';
import { Screen } from '../ui/Screen';
import { colors, radius } from '../ui/theme';

interface GameTileProps {
  title: string;
  tagline: string;
  deckId: string;
  page: number;
  onPress?: () => void;
  soonLabel?: string;
}

function GameTile({ title, tagline, deckId, page, onPress, soonLabel }: GameTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, !onPress && styles.tileSoon, pressed && styles.pressed]}
    >
      <CardImage source={pageImage(deckId, page)} width={56} />
      <View style={styles.tileText}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileTagline}>{tagline}</Text>
      </View>
      {soonLabel ? <Text style={styles.soon}>{soonLabel}</Text> : <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export function HomeScreen() {
  const { t } = useI18n();
  const nav = useNav();
  return (
    <Screen title={t('appTitle')} right={<LanguageToggle />}>
      <Text style={styles.section}>{t('games')}</Text>
      <GameTile
        title="Matatu"
        tagline={t('matatuTagline')}
        deckId="kirazira"
        page={14}
        onPress={() => nav.push({ name: 'matatuSetup' })}
      />
      <GameTile
        title="Amaturufu"
        tagline={t('amaturufuTagline')}
        deckId="ntibavuga-bavuga"
        page={27}
        onPress={() => nav.push({ name: 'amaturufuSetup' })}
      />
      <GameTile title="Ibisakuzo" tagline={t('ibisakuzoTagline')} deckId="ibisakuzo" page={1} soonLabel={t('comingSoon')} />

      <View style={styles.sectionRow}>
        <Text style={styles.section}>{t('decks')}</Text>
        <Pressable accessibilityRole="button" onPress={() => nav.push({ name: 'decks' })} hitSlop={8}>
          <Text style={styles.link}>{t('browseDecks')} ›</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.covers}>
        {DECKS.map((d) => (
          <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={d.title} onPress={() => nav.push({ name: 'deck', deckId: d.id })}>
            <CardImage source={pageImage(d.id, d.cover.page)} width={96} />
            <Text style={styles.coverTitle} numberOfLines={1}>
              {d.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  link: { color: colors.accent, fontWeight: '600', fontSize: 15 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileSoon: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  tileText: { flex: 1, gap: 2 },
  tileTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  tileTagline: { fontSize: 14, color: colors.muted },
  chevron: { fontSize: 28, color: colors.accent, fontWeight: '300' },
  soon: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  covers: { gap: 12, paddingRight: 16 },
  coverTitle: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.ink, width: 96, textAlign: 'center' },
});
