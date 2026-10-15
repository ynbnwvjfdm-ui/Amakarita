import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Tap } from './fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StringKey, useI18n } from '../i18n';
import { Button } from './Button';
import { CardArt } from './CardArt';
import { Overlay } from './Overlay';
import { colors, fonts, MAX_WIDTH, radius } from './theme';

export type GuideGame = 'matatu' | 'quiz' | 'ibisakuzo';

interface Page {
  title: StringKey;
  body: StringKey;
  /** Card ids without the deck prefix, e.g. "2S" or "joker1". */
  cards: string[];
}

const PAGES: Record<GuideGame, Page[]> = {
  matatu: [
    { title: 'gMatGoalT', body: 'gMatGoal', cards: [] },
    { title: 'gMatPlayT', body: 'gMatPlay', cards: ['5H', '5S', '9H'] },
    { title: 'gMatPickT', body: 'gMatPick', cards: ['2S', '3H', 'joker1'] },
    { title: 'gMatSpecialT', body: 'gMatSpecial', cards: ['AS', 'JC', '8D', 'QH'] },
    { title: 'gMatCutT', body: 'gMatCut', cards: ['7C'] },
    { title: 'gMatCareT', body: 'gMatCare', cards: [] },
  ],
  quiz: [
    { title: 'gQuizHowT', body: 'gQuizHow', cards: [] },
    { title: 'gQuizPointsT', body: 'gQuizPoints', cards: ['7S', 'QH', 'AD'] },
    { title: 'gQuizJokerT', body: 'gQuizJoker', cards: ['joker2'] },
    { title: 'gQuizWinT', body: 'gQuizWin', cards: [] },
    { title: 'gQuizLearnT', body: 'gQuizLearn', cards: [] },
  ],
  ibisakuzo: [
    { title: 'gRidGoalT', body: 'gRidGoal', cards: [] },
    { title: 'gRidSakweT', body: 'gRidSakwe', cards: ['02'] },
    { title: 'gRidAnswerT', body: 'gRidAnswer', cards: [] },
    { title: 'gRidWinT', body: 'gRidWin', cards: [] },
  ],
};

const KEY = 'amakarita.guides.v1';

/**
 * Whether to show a game's guide: by itself the first time the game is
 * opened on this phone, and whenever the "?" button asks for it.
 */
export function useGuide(game: GuideGame) {
  const [seen, setSeen] = useState<boolean | null>(null);
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => AsyncStorage.getItem(KEY))
      .then((text) => {
        if (alive) setSeen(Boolean(text && JSON.parse(text)[game]));
      })
      .catch(() => {
        if (alive) setSeen(false);
      });
    return () => {
      alive = false;
    };
  }, [game]);
  const close = () => {
    setAsked(false);
    setSeen(true);
    Promise.resolve()
      .then(() => AsyncStorage.getItem(KEY))
      .then((text) => AsyncStorage.setItem(KEY, JSON.stringify({ ...(text ? JSON.parse(text) : {}), [game]: true })))
      .catch(() => {});
  };
  return { visible: asked || seen === false, open: () => setAsked(true), close };
}

/** A round "?" button that opens the guide. */
export function HelpButton({ onPress }: { onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Tap accessibilityRole="button" accessibilityLabel={t('howToPlay')} onPress={onPress} hitSlop={6} style={styles.help}>
      <Ionicons name="help" size={22} color={colors.ink} />
    </Tap>
  );
}

/** A few short pages on how a game is played, with real cards from the deck. */
export function HowToPlay({ game, deckId, visible, onClose }: { game: GuideGame; deckId: string; visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pages = PAGES[game];
  const p = pages[Math.min(page, pages.length - 1)];
  const last = page >= pages.length - 1;
  const deck = deckId === 'mix' ? 'ntibavuga-bavuga' : deckId;
  const room = Math.min(width, MAX_WIDTH) - 48 - 40;
  const cardW = Math.min(96, (room - 8 * (Math.max(p.cards.length, 1) - 1)) / Math.max(p.cards.length, 1));
  const finish = () => {
    setPage(0);
    onClose();
  };

  return (
    <Overlay visible={visible} onRequestClose={finish}>
      <View style={styles.dim}>
        <View style={styles.panel}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>{t('howToPlay')}</Text>
            <Text style={styles.title}>{t(p.title)}</Text>
            {p.cards.length ? (
              <View style={styles.cards}>
                {p.cards.map((c) => (
                  <CardArt key={c} deckId={deck} cardId={`${deck}-${c}`} width={cardW} />
                ))}
              </View>
            ) : null}
            <Text style={styles.text}>{t(p.body)}</Text>
          </ScrollView>
          <View style={styles.dots}>
            {pages.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          <View style={styles.buttons}>
            {last ? null : (
              <Tap accessibilityRole="button" onPress={finish} style={styles.skip} hitSlop={6}>
                <Text style={styles.skipText}>{t('guideSkip')}</Text>
              </Tap>
            )}
            <Button variant="lime" label={last ? t('start') : t('continue')} onPress={() => (last ? finish() : setPage(page + 1))} style={styles.next} />
          </View>
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(10,8,20,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { width: '100%', maxWidth: 420, maxHeight: '100%', backgroundColor: colors.bg, borderRadius: radius.panel, padding: 20, gap: 14 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  body: { gap: 12 },
  kicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.4 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 6 },
  text: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: colors.ink },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.ink },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  skipText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.muted },
  next: { flex: 1 },
  help: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
