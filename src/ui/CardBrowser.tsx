import { useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayNumber } from '../dates';
import { CARD_RATIO, getDeck } from '../decks';
import { seededRng, shuffle } from '../game/cards';
import { answeredOn } from '../game/progress';
import { Question } from '../game/quiz';
import { useI18n } from '../i18n';
import { useProgress } from '../progressStore';
import { questionFor } from '../questions';
import { CardArt } from './CardArt';
import { FlipCard } from './FlipCard';
import { feel } from './motion';
import { Overlay } from './Overlay';
import { QuestionCard } from './QuestionCard';
import { QuestionPlay } from './QuestionPlay';
import { shareText } from './share';
import { colors, fonts, MAX_WIDTH, radius } from './theme';

interface Props {
  deckId: string;
  /** The page opened first, or null when closed. */
  start: number | null;
  onClose: () => void;
}

/**
 * A deck's cards one at a time, full size. A card with a question shows its
 * question side first (the printed card holds the answer) and turns over once
 * answered. Swipe left or right for the next or previous card.
 */
export function CardBrowser({ deckId, start, onClose }: Props) {
  return (
    <Overlay visible={start !== null} onRequestClose={onClose}>
      {/* Mounted fresh each time it opens, so answers from last time are cleared. */}
      {start !== null ? <Pages key={start} deckId={deckId} start={start} onClose={onClose} /> : null}
    </Overlay>
  );
}

const TOP_BAR = 60;
/** Room kept under the card for three choices and the result. */
const QUESTION_ROOM = 270;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function Pages({ deckId, start, onClose }: { deckId: string; start: number; onClose: () => void }) {
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { active, progress, record } = useProgress();
  const deck = getDeck(deckId);
  const pages = Array.from({ length: deck.pageCount }, (_, i) => i + 1);
  const first = Math.max(0, pages.indexOf(start));
  const [index, setIndex] = useState(first);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Cards turned to their printed side: by answering, or by tapping the card.
  const [turned, setTurned] = useState<Record<string, boolean>>({});
  // A new order of choices each time the cards are opened, the same while swiping back and forth.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 32));
  const today = answeredOn(progress, dayNumber(new Date()));

  const column = Math.min(width, MAX_WIDTH) - 32;
  const free = height - insets.top - insets.bottom - TOP_BAR;
  const cardFor = (q: Question | undefined) =>
    q && q.kind !== 'read' && q.options
      ? Math.max(140, Math.min(column * 0.72, (free - QUESTION_ROOM) * CARD_RATIO))
      : Math.min(column * 0.84, (free - 40) * CARD_RATIO);

  const choose = (q: Question, option: string) => {
    if (answers[q.card]) return;
    const right = option === q.answer;
    setAnswers((a) => ({ ...a, [q.card]: option }));
    setTurned((v) => ({ ...v, [q.card]: true }));
    record(active.id, q.card, right);
    if (right) feel.right();
    else feel.wrong();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i >= 0 && i < pages.length) setIndex(i);
  };

  const current = deck.cards.find((c) => c.page === pages[index]);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.top, { width: Math.min(width, MAX_WIDTH) }]}>
        <Text style={styles.count}>
          {index + 1} / {pages.length}
        </Text>
        <View style={styles.topRight}>
          {current?.text ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shareCard')}
              onPress={() => shareText(`${deck.title}\n\n${current.text}\n\n— Amakarita`)}
              hitSlop={6}
              style={styles.share}
            >
              <Ionicons name="share-outline" size={20} color={colors.ink} />
              <Text style={styles.shareText}>{t('shareShort')}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="close" onPress={onClose} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
      </View>
      <FlatList
        data={pages}
        style={{ width, flex: 1 }}
        keyExtractor={(p) => String(p)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={first}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        onScroll={onScroll}
        scrollEventThrottle={32}
        extraData={[answers, turned]}
        renderItem={({ item: page }) => {
          const card = deck.cards.find((c) => c.page === page);
          const q = card ? questionFor(card.id) : undefined;
          // The question to answer, if this card has one.
          const ask = q && q.kind !== 'read' && q.options ? q : null;
          const w = cardFor(q);
          return (
            <ScrollView
              style={{ width }}
              contentContainerStyle={styles.page}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.pageColumn, { width: Math.min(width, MAX_WIDTH) - 32 }]}>
                <View style={styles.cardRow}>
                  {ask ? (
                    // Tapping turns the card too; nothing on screen says so, but screen readers do.
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={turned[ask.card] ? t('tapToFlipBack') : t('tapToReveal')}
                      onPress={() => setTurned((v) => ({ ...v, [ask.card]: !v[ask.card] }))}
                    >
                      <FlipCard
                        flipped={!!turned[ask.card]}
                        width={w}
                        height={w / CARD_RATIO}
                        front={<QuestionCard question={ask} width={w} view="quiz" />}
                        back={<CardArt deckId={deckId} page={page} width={w} />}
                      />
                    </Pressable>
                  ) : (
                    <CardArt deckId={deckId} page={page} width={w} />
                  )}
                </View>
                {ask ? (
                  <QuestionPlay
                    question={ask}
                    options={shuffle(ask.options!, seededRng(seed ^ hash(ask.card)))}
                    chosen={answers[ask.card] ?? null}
                    onChoose={(o) => choose(ask, o)}
                    today={today}
                  />
                ) : null}
              </View>
            </ScrollView>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Solid, so the deck screen behind never shows through the cards.
  backdrop: { flex: 1, backgroundColor: '#0A0814', alignItems: 'center' },
  top: { height: TOP_BAR, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  count: { fontFamily: fonts.bold, fontSize: 16, color: '#FFFFFF' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  shareText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  close: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 28 },
  pageColumn: { gap: 16 },
  cardRow: { alignItems: 'center' },
});
