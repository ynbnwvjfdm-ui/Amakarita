import { useEffect, useState } from 'react';
import { ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CARD_RATIO, cardImage, getDeck, pageImage } from '../decks';
import { QUESTIONS } from '../questions';
import { quizWinners, stealTarget, STEAL } from '../game/quiz';
import { useI18n } from '../i18n';
import { QuizConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { FlipCard } from '../ui/FlipCard';
import { QuestionCard } from '../ui/QuestionCard';
import { LeaveConfirm, Panel } from '../ui/table';
import { colors, deckTheme, fonts, MAX_WIDTH, MIX_THEME, radius } from '../ui/theme';
import { useQuizTable } from './useQuizTable';

export function QuizGameScreen({ config }: { config: QuizConfig }) {
  const { t } = useI18n();
  const nav = useNav();
  const table = useQuizTable(config);
  const { game, bot, revealed } = table;
  const { width, height } = useWindowDimensions();
  const [leaving, setLeaving] = useState(false);
  const [zoom, setZoom] = useState<ImageSourcePropType | null>(null);
  // After answering, the card turns to show the printed card; tap to turn it back.
  // Remembered per turn, so a new question always starts question-side up.
  const [printedFor, setPrintedFor] = useState<string | null>(null);

  const n = config.seats.length;
  const solo = config.seats.filter((s) => s.kind === 'human').length === 1;
  const name = (seat: number) =>
    config.seats[seat].name ?? (solo && config.seats[seat].kind === 'human' ? t('you') : t('playerN', { n: seat + 1 }));
  const turnName = name(game.turn);
  const current = game.current;
  const nextId = game.pile[0];
  const stageDeck = current?.question.deck ?? (nextId ? QUESTIONS[nextId].deck : null);
  const theme = stageDeck ? deckTheme(stageDeck) : MIX_THEME;

  const W = Math.min(width, MAX_WIDTH);
  const cardW = Math.min(W * 0.62, (height * 0.42) * CARD_RATIO);
  const cardH = cardW / CARD_RATIO;

  const turnKey = current ? `${game.pile.length}:${current.question.card}` : null;
  const showPrinted = game.phase === 'result' && printedFor === turnKey;
  useEffect(() => {
    if (game.phase !== 'result' || !turnKey) return;
    const id = setTimeout(() => setPrintedFor(turnKey), 900);
    return () => clearTimeout(id);
  }, [game.phase, turnKey]);

  const result = game.result;
  const reader = n > 1 ? name((game.turn - 1 + n) % n) : null;
  const from = stealTarget(game, game.turn);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.base }]} edges={['top', 'bottom']}>
      <View style={[styles.column, { width: W }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('leaveGame')} onPress={() => setLeaving(true)} style={styles.round}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.targetPill}>
            <Ionicons name="flag" size={14} color={colors.ink} />
            <Text style={styles.targetText}>{t('targetPoints', { n: config.target })}</Text>
          </View>
          <View style={styles.leftPill} accessibilityLabel={t('cardsCount', { n: game.pile.length })}>
            <Ionicons name="albums-outline" size={15} color={colors.ink} />
            <Text style={styles.left}>{game.pile.length}</Text>
          </View>
        </View>

        {/* Scores */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scores} style={{ flexGrow: 0 }}>
          {game.scores.map((score, seat) => {
            const on = seat === game.turn && game.phase !== 'over';
            return (
              <View key={seat} style={[styles.score, on && styles.scoreOn]}>
                <Text style={[styles.scoreName, on && styles.scoreNameOn]} numberOfLines={1}>
                  {name(seat)}
                </Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreNum, on && styles.scoreNumOn]}>{score}</Text>
                  {game.doubled[seat] ? <Text style={styles.double}>×2</Text> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* The card */}
        <View style={styles.stage}>
          {game.phase === 'draw' && nextId ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('drawCard')} onPress={table.draw} disabled={bot} style={styles.drawWrap}>
              <View style={[styles.pileCard, { width: cardW, height: cardH, transform: [{ rotate: '6deg' }] }]} />
              <View style={[styles.pileCard, { width: cardW, height: cardH, transform: [{ rotate: '-4deg' }] }]} />
              <CardImage source={pageImage(QUESTIONS[nextId].deck, getDeck(QUESTIONS[nextId].deck).cover.page)} width={cardW} />
            </Pressable>
          ) : current ? (
            <Pressable accessibilityRole="button" onPress={() => game.phase === 'result' && setPrintedFor((k) => (k === turnKey ? null : turnKey))}>
              <FlipCard
                flipped={showPrinted}
                width={cardW}
                height={cardH}
                front={
                  <QuestionCard
                    question={current.question}
                    sort={current.sort}
                    width={cardW}
                    view={config.mode === 'phone' ? 'quiz' : 'read'}
                    revealed={game.phase !== 'answer' || revealed}
                    doubled={game.doubled[game.turn]}
                  />
                }
                back={
                  <CardImage
                    source={cardImage(QUESTIONS[current.sort?.card ?? current.question.card].deck, current.sort?.card ?? current.question.card)}
                    width={cardW}
                  />
                }
              />
            </Pressable>
          ) : null}
        </View>

        {/* What to do now */}
        <View style={styles.panel}>
          <Text style={[styles.turn, { color: theme.onBase }]}>
            {game.phase === 'answer' && config.mode === 'group' && reader
              ? t('readerAsk', { reader, name: turnName })
              : bot && game.phase === 'answer'
                ? t('thinking', { name: turnName })
                : solo && !bot
                  ? t('yourTurnQuiz')
                  : t('turnOfName', { name: turnName })}
          </Text>

          {game.phase === 'draw' && !bot ? <Button variant="lime" label={t('drawCard')} onPress={table.draw} /> : null}

          {game.phase === 'answer' && config.mode === 'phone' && current ? (
            <View style={styles.options}>
              {current.options.map((o) => (
                <Pressable
                  key={o}
                  accessibilityRole="button"
                  disabled={bot}
                  onPress={() => table.choose(o)}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <Text style={styles.optionText}>{o}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {game.phase === 'answer' && config.mode === 'group' && current ? (
            revealed ? (
              <>
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>{t('answerIs')}</Text>
                  <Text style={styles.answerText}>
                    {current.sort ? (current.sort.answer === 'kirazira' ? t('kirazira') : t('indangagaciro')) : current.question.answer}
                  </Text>
                </View>
                <View style={styles.judgeRow}>
                  <Button variant="secondary" label={`✕  ${t('saidWrong')}`} onPress={() => table.judge(false)} style={{ flex: 1 }} />
                  <Button variant="lime" label={`✓  ${t('saidRight')}`} onPress={() => table.judge(true)} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.hint, { color: theme.onBase }]}>{t('readAloud')}</Text>
                <Button variant="secondary" label={t('showAnswer')} onPress={table.reveal} />
              </>
            )
          ) : null}

          {game.phase === 'joker' && current ? (
            <View style={styles.jokerBox}>
              <Text style={styles.jokerTitle}>{t('joker')}</Text>
              {from !== null ? (
                <Button variant="lime" label={t('jokerSteal', { n: Math.min(STEAL, game.scores[from]), name: name(from) })} onPress={() => table.joker('steal')} disabled={bot} />
              ) : null}
              <Button variant="primary" label={t('jokerDouble')} onPress={() => table.joker('double')} disabled={bot} />
            </View>
          ) : null}

          {game.phase === 'result' && result ? (
            <>
              <View style={[styles.verdict, { backgroundColor: result.correct === false ? colors.coral : colors.lime }]}>
                <Text style={styles.verdictText}>
                  {result.correct === null ? t('readCard') : result.correct ? t('correct') : t('notQuite')}
                </Text>
                {result.points > 0 ? <Text style={styles.verdictPoints}>+{result.points}</Text> : null}
              </View>
              {result.correct === false && current?.question.answer ? (
                <Text style={[styles.hint, { color: theme.onBase }]}>
                  {t('answerIs')}: {current.sort ? (current.sort.answer === 'kirazira' ? t('kirazira') : t('indangagaciro')) : current.question.answer}
                </Text>
              ) : null}
              <Button variant="primary" label={t('continue')} onPress={table.next} style={styles.onDark} />
            </>
          ) : null}
        </View>
      </View>

      <Panel visible={game.phase === 'over'} title={t('gameOver')}>
        <Text style={styles.winner}>
          {(() => {
            const w = quizWinners(game);
            if (w.length > 1) return t('draw');
            return solo && config.seats[w[0]].kind === 'human' && config.seats[w[0]].name === null ? t('youWin') : t('wins', { name: name(w[0]) });
          })()}
        </Text>
        {game.scores
          .map((s, seat) => ({ s, seat }))
          .sort((a, b) => b.s - a.s)
          .map(({ s, seat }) => (
            <View key={seat} style={styles.finalRow}>
              <Text style={styles.finalName}>{name(seat)}</Text>
              <Text style={styles.finalScore}>{s}</Text>
            </View>
          ))}
        <Text style={styles.learned}>{t('learnedN', { n: game.learned.length })}</Text>
        {game.missed.length ? (
          <>
            <Text style={styles.reviewTitle}>{t('toReview')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {game.missed.map((id) => (
                <Pressable key={id} onPress={() => setZoom(cardImage(QUESTIONS[id].deck, id))}>
                  <CardImage source={cardImage(QUESTIONS[id].deck, id)} width={64} />
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <Button variant="lime" label={t('playAgain')} onPress={table.playAgain} />
        <Button variant="secondary" label={t('home')} onPress={nav.home} />
      </Panel>

      <CardViewer source={zoom} onClose={() => setZoom(null)} />
      <LeaveConfirm visible={leaving} onLeave={nav.home} onStay={() => setLeaving(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  round: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  leftPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, height: 36 },
  left: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  targetPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 14, height: 36 },
  targetText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  scores: { gap: 8, paddingVertical: 6 },
  score: { minWidth: 92, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  scoreOn: { backgroundColor: colors.lime },
  scoreName: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.85)', maxWidth: 110 },
  scoreNameOn: { color: colors.ink },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreNum: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.surface, letterSpacing: -0.5 },
  scoreNumOn: { color: colors.ink },
  double: { fontFamily: fonts.display, fontSize: 14, color: colors.coral },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  drawWrap: { alignItems: 'center', justifyContent: 'center' },
  pileCard: { position: 'absolute', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)' },
  panel: { gap: 10, paddingBottom: 12 },
  turn: { fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  hint: { fontFamily: fonts.semibold, fontSize: 14, textAlign: 'center', opacity: 0.9 },
  options: { gap: 8 },
  option: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  optionPressed: { backgroundColor: colors.lime, transform: [{ scale: 0.98 }] },
  optionText: { fontFamily: fonts.card, fontSize: 22, color: colors.ink, letterSpacing: 0.5, textAlign: 'center' },
  answerBox: { backgroundColor: colors.lime, borderRadius: 20, padding: 14, alignItems: 'center', gap: 2 },
  answerLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
  answerText: { fontFamily: fonts.card, fontSize: 28, color: colors.ink, textAlign: 'center' },
  judgeRow: { flexDirection: 'row', gap: 10 },
  jokerBox: { backgroundColor: colors.surface, borderRadius: 24, padding: 14, gap: 10 },
  jokerTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: 'center' },
  verdict: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12 },
  verdictText: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  verdictPoints: { fontFamily: fonts.display, fontSize: 34, color: colors.ink, letterSpacing: -1 },
  onDark: { backgroundColor: colors.ink, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  winner: { fontFamily: fonts.display, fontSize: 22, color: colors.accent, textAlign: 'center' },
  finalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  finalScore: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  learned: { fontFamily: fonts.bold, fontSize: 14, color: colors.muted, textAlign: 'center' },
  reviewTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
});
