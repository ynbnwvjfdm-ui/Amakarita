import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Burst, CountUp, FillBar, Pulse, SpinIn, Tap } from '../ui/fx';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayNumber } from '../dates';
import { CARD_RATIO } from '../decks';
import { shuffle } from '../game/cards';
import { DAILY_GOAL, answeredOn, streak } from '../game/progress';
import { cardPoints } from '../game/quiz';
import { Review, answerReview, currentTurn, newReview, nextReview, pickReview, reviewOver, reviewSummary } from '../game/review';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { useProgress } from '../progressStore';
import { deckStats } from '../stats';
import { QUESTIONS, REVIEWABLE } from '../questions';
import { Button } from '../ui/Button';
import { ArtRef, CardArt } from '../ui/CardArt';
import { CardViewer } from '../ui/CardViewer';
import { FlipCard } from '../ui/FlipCard';
import { GameTopBar, InfoPill, PillText } from '../ui/GameChrome';
import { MEDAL_KEY, MedalIcon } from '../ui/Medal';
import { feel, PopIn } from '../ui/motion';
import { QuestionCard } from '../ui/QuestionCard';
import { QuestionPlay } from '../ui/QuestionPlay';
import { colors, fonts, MAX_WIDTH, radius } from '../ui/theme';

const TOP_BAR = 56;
/** Room kept under the card for three choices, the result and the "Continue" button. */
const BELOW_CARD = 350;
const MIN_CARD_W = 120;

/**
 * Today's 10 cards for the person using the phone: the ones they keep
 * missing first (src/game/review.ts). Answers count like any other.
 */
export function ReviewScreen() {
  const { t } = useI18n();
  const nav = useNav();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { active, progress, record } = useProgress();
  // Every card reviewed since this screen opened, so "10 more" brings new ones.
  const [first] = useState(() => pickReview(progress, REVIEWABLE, Math.random));
  const [seen, setSeen] = useState<string[]>(first);
  const [review, setReview] = useState<Review>(() => newReview(first));
  // The choices in the order shown and the one picked, for the card on screen.
  const [options, setOptions] = useState<string[]>(() => optionsFor(review));
  const [chosen, setChosen] = useState<string | null>(null);
  const [turned, setTurned] = useState(false);
  const [zoom, setZoom] = useState<ArtRef | null>(null);
  // Where things stood when the screen opened, to celebrate a goal met or a medal won here.
  const [start] = useState(() => ({ done: answeredOn(progress, dayNumber(new Date())), medals: deckStats(progress).map((d) => d.medal) }));

  const W = Math.min(width, MAX_WIDTH);
  const free = height - insets.top - insets.bottom - TOP_BAR;
  const cardW = Math.max(MIN_CARD_W, Math.min((W - 32) * 0.7, (free - BELOW_CARD) * CARD_RATIO));
  const today = dayNumber(new Date());
  const summary = reviewSummary(review);
  const points = summary.rightCards.reduce((sum, id) => sum + cardPoints(QUESTIONS[id]), 0);
  const turn = currentTurn(review);
  const q = turn ? QUESTIONS[turn.card] : null;

  const choose = (option: string) => {
    if (!q || chosen !== null) return;
    const right = option === q.answer;
    setChosen(option);
    setTurned(true);
    setReview((r) => answerReview(r, right));
    record(active.id, q.card, right);
    if (right) feel.right();
    else feel.wrong();
  };

  const next = () => {
    const r = nextReview(review);
    setReview(r);
    setOptions(optionsFor(r));
    setChosen(null);
    setTurned(false);
  };

  const more = () => {
    const cards = pickReview(progress, REVIEWABLE, Math.random, undefined, seen);
    const r = newReview(cards);
    setSeen((s) => [...s, ...cards]);
    setReview(r);
    setOptions(optionsFor(r));
    setChosen(null);
    setTurned(false);
  };

  if (reviewOver(review)) {
    const done = Math.min(DAILY_GOAL, answeredOn(progress, today));
    const days = streak(progress, today);
    const left = REVIEWABLE.length - seen.length;
    const goalNow = done >= DAILY_GOAL && start.done < DAILY_GOAL;
    const won = deckStats(progress).filter((d, i) => d.medal && d.medal !== start.medals[i]);
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.endPage} bounces={false} showsVerticalScrollIndicator={false}>
          <PopIn from="grow" style={[styles.end, { width: W - 32 }]}>
            <Text style={styles.endTitle}>{t('reviewDone')}</Text>
            {summary.total > 0 ? (
              <>
                <View style={styles.endPoints}>
                  <Text style={styles.endBig}>+</Text>
                  <CountUp value={points} duration={900} style={[styles.endBig, styles.endBigNumber]} />
                  <Text style={styles.endLabel}>{t('points')}</Text>
                </View>
                <Text style={styles.endLine}>{t('reviewRight', { n: summary.rightFirst, total: summary.total })}</Text>
              </>
            ) : null}
            <View style={styles.goal}>
              <View style={styles.goalHead}>
                <Text style={styles.goalLabel}>{t('dailyGoal')}</Text>
                <Text style={styles.goalCount}>
                  {done}/{DAILY_GOAL}
                </Text>
                {done >= DAILY_GOAL ? (
                  <SpinIn delay={500}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.ink} />
                  </SpinIn>
                ) : null}
              </View>
              <View style={styles.goalTrack}>
                <FillBar share={done / DAILY_GOAL} delay={250} style={styles.goalFill} />
              </View>
              {/* Meeting today's goal in this review gets the big burst. */}
              <Burst trigger={goalNow ? 'goal' : null} big />
              {days > 0 ? (
                <View style={styles.streak}>
                  <Pulse>
                    <Ionicons name="flame" size={14} color={colors.coral} />
                  </Pulse>
                  <Text style={styles.streakText}>{t('streakDays', { n: days })}</Text>
                </View>
              ) : null}
            </View>
            {won.map(({ deck, medal }, i) => (
              <View key={deck.id} style={styles.medalRow}>
                <SpinIn delay={600 + 250 * i}>
                  <MedalIcon medal={medal} size={30} />
                </SpinIn>
                <Text style={styles.medalText}>
                  {t('newMedal')}: {deck.title} · {t(MEDAL_KEY[medal!])}
                </Text>
                <Burst trigger={`medal-${deck.id}`} big />
              </View>
            ))}
            {summary.missed.length ? (
              <>
                <Text style={styles.reviewTitle}>{t('toReview')}</Text>
                <View style={styles.missed}>
                  {summary.missed.map((id) => (
                    <Tap key={id} accessibilityRole="button" onPress={() => setZoom({ deckId: QUESTIONS[id].deck, cardId: id })}>
                      <CardArt deckId={QUESTIONS[id].deck} cardId={id} width={56} />
                    </Tap>
                  ))}
                </View>
              </>
            ) : null}
            {left > 0 ? <Button variant="lime" label={t('reviewMore')} onPress={more} /> : <Text style={styles.endLine}>{t('reviewAllDone')}</Text>}
            <Button variant="secondary" label={t('home')} onPress={nav.home} />
          </PopIn>
        </ScrollView>
        <CardViewer art={zoom} onClose={() => setZoom(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.column, { width: W }]}>
        <GameTopBar
          onLeave={nav.pop}
          leaveLabel={t('back')}
          center={
            <InfoPill>
              <Ionicons name={turn?.again ? 'refresh' : 'albums-outline'} size={15} color={colors.ink} />
              <PillText>{turn?.again ? t('reviewAgain') : `${review.pos + 1} / ${summary.total}`}</PillText>
            </InfoPill>
          }
          right={
            <InfoPill label={t('points')}>
              <Ionicons name="star" size={14} color={colors.ink} />
              <PillText>+{points}</PillText>
            </InfoPill>
          }
        />
      </View>
      {/* Scrolls only on a screen too short for the card and its choices. */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page} bounces={false} showsVerticalScrollIndicator={false}>
        {q ? (
          <View key={review.pos} style={[styles.pageColumn, { width: W - 32 }]}>
            <View style={styles.cardRow}>
              {/* Tapping turns the card too, as in the deck browser; nothing on screen says so. */}
              <Tap
                accessibilityRole="button"
                accessibilityLabel={turned ? t('tapToFlipBack') : t('tapToReveal')}
                onPress={() => setTurned((v) => !v)}
              >
                <FlipCard
                  flipped={turned}
                  width={cardW}
                  height={cardW / CARD_RATIO}
                  front={<QuestionCard question={q} width={cardW} view="quiz" />}
                  back={<CardArt deckId={q.deck} cardId={q.card} width={cardW} />}
                />
              </Tap>
            </View>
            <QuestionPlay question={q} options={options} chosen={chosen} onChoose={choose} today={answeredOn(progress, today)} />
            {chosen !== null ? <Button variant="lime" label={t('continue')} onPress={next} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function optionsFor(r: Review): string[] {
  const turn = currentTurn(r);
  const q = turn ? QUESTIONS[turn.card] : null;
  return q?.options ? shuffle(q.options, Math.random) : [];
}

const styles = StyleSheet.create({
  // The same dark backdrop as the deck browser, where these cards are also answered.
  safe: { flex: 1, backgroundColor: '#0A0814' },
  column: { alignSelf: 'center', paddingHorizontal: 16, height: TOP_BAR, justifyContent: 'center' },
  scroll: { flex: 1 },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 20 },
  pageColumn: { gap: 14 },
  cardRow: { alignItems: 'center' },
  endPage: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  end: { backgroundColor: colors.surface, borderRadius: 28, padding: 18, gap: 12 },
  endTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  endPoints: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 },
  endBig: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.ink, letterSpacing: -1 },
  endBigNumber: { minWidth: 30 },
  medalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 18, padding: 10 },
  medalText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  endLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  endLine: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  goal: { gap: 6, backgroundColor: colors.bg, borderRadius: 18, padding: 12 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  goalCount: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  goalTrack: { height: 10, borderRadius: 5, backgroundColor: colors.surface, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 5, backgroundColor: colors.lime },
  streak: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  streakText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  reviewTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
  missed: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
