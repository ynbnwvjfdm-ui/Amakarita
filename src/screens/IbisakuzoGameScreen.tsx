import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dayNumber } from '../dates';
import { CARD_RATIO, getDeck } from '../decks';
import { RIDDLE_POINTS, askerOf, riddleWinners, riddlesLeft } from '../game/ibisakuzo';
import { DAILY_GOAL, answeredOn } from '../game/progress';
import { useI18n } from '../i18n';
import { IbisakuzoConfig, useNav } from '../navigation';
import { useProgress } from '../progressStore';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { FitScroll } from '../ui/FitScroll';
import { GameTopBar, InfoPill, PillText, PlayerChips } from '../ui/GameChrome';
import { HelpButton, HowToPlay, useGuide } from '../ui/HowToPlay';
import { feel, PopIn } from '../ui/motion';
import { Avatar } from '../ui/Profiles';
import { RiddleCard } from '../ui/RiddleCard';
import { LeaveConfirm, Panel } from '../ui/table';
import { colors, deckTheme, fonts, MAX_WIDTH, radius } from '../ui/theme';
import { useIbisakuzoTable } from './useIbisakuzoTable';

/** The card never gets narrower than this. */
const MIN_CARD_W = 120;
const deck = getDeck('ibisakuzo');
const theme = deckTheme('ibisakuzo');
const cardOf = (id: string) => deck.cards.find((c) => c.id === id)!;

export function IbisakuzoGameScreen({ config }: { config: IbisakuzoConfig }) {
  const { t } = useI18n();
  const nav = useNav();
  const table = useIbisakuzoTable(config);
  const { game, revealed } = table;
  const { profiles, progressOf } = useProgress();
  const guide = useGuide('ibisakuzo');
  const { width } = useWindowDimensions();
  const [leaving, setLeaving] = useState(false);
  // The card is sized to the space measured between the scores and the buttons.
  const [stage, setStage] = useState({ w: 0, h: 0 });

  // A buzz once the asker has said: a happy one when right.
  useEffect(() => {
    if (game.phase !== 'result' || game.correct === null) return;
    if (game.correct) feel.right();
    else feel.wrong();
  }, [game.phase, game.correct]);

  const name = (seat: number) => config.seats[seat].name ?? t('playerN', { n: seat + 1 });
  const answerer = name(game.turn);
  const asker = name(askerOf(game));
  const card = game.current ? cardOf(game.current) : null;

  const W = Math.min(width, MAX_WIDTH);
  const cardW = stage.h > 0 ? Math.max(MIN_CARD_W, Math.min(W * 0.7, (stage.h - 16) * CARD_RATIO)) : 0;
  const onStage = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (Math.abs(h - stage.h) > 1 || Math.abs(w - stage.w) > 1) setStage({ w, h });
  };

  const winners = game.phase === 'over' ? riddleWinners(game) : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.base }]} edges={['top', 'bottom']}>
      <FitScroll>
        <View style={[styles.column, { width: W }]}>
          <GameTopBar
            onLeave={() => setLeaving(true)}
            leaveLabel={t('leaveGame')}
            center={
              <InfoPill>
                <Ionicons name="hourglass-outline" size={14} color={colors.ink} />
                <PillText>{t('attemptsLeft', { n: riddlesLeft(game, game.turn) })}</PillText>
              </InfoPill>
            }
            right={<HelpButton onPress={guide.open} />}
          />

          <PlayerChips
            width={W - 32}
            players={game.scores.map((score, seat) => ({ key: seat, name: name(seat), value: score, active: seat === game.turn && game.phase !== 'over' }))}
          />

          <Text style={styles.roles}>{t('ridAsks', { asker, name: answerer })}</Text>

          {/* The card, as large as the space between the scores and the buttons allows */}
          <View style={styles.stage} onLayout={onStage}>
            {cardW > 0 ? (
              card ? (
                <PopIn key={card.id}>
                  <RiddleCard page={card.page} width={cardW} covered={!revealed} onUncover={game.phase === 'riddle' ? table.reveal : undefined} />
                </PopIn>
              ) : (
                <CardImage deckId="ibisakuzo" page={deck.cover.page} width={cardW} />
              )
            ) : null}
          </View>

          <View style={styles.panel}>
            {game.phase === 'sakwe' ? (
              <>
                <Text style={styles.sakwe}>{t('sakwe')}</Text>
                <Text style={styles.hint}>{t('sakweHint', { asker, name: answerer })}</Text>
                <Button
                  variant="lime"
                  label={t('soma')}
                  onPress={() => {
                    feel.play();
                    table.soma();
                  }}
                />
              </>
            ) : null}

            {game.phase === 'riddle' && card && !revealed ? (
              <>
                {/* Large enough to read out loud; the printed lettering is small on a phone. */}
                <Text style={styles.riddle}>{card.riddle?.text}</Text>
                <Text style={styles.hint}>{t('readRiddle', { name: answerer })}</Text>
                <Button variant="secondary" label={t('showAnswer')} onPress={table.reveal} />
              </>
            ) : null}

            {game.phase === 'riddle' && card && revealed ? (
              <>
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>{t('answerIs')}</Text>
                  <Text style={styles.answerText}>{card.answer?.text}</Text>
                </View>
                <View style={styles.judgeRow}>
                  <Button variant="secondary" label={`✕  ${t('saidWrong')}`} onPress={() => table.judge(false)} style={{ flex: 1 }} />
                  <Button variant="lime" label={`✓  ${t('saidRight')}`} onPress={() => table.judge(true)} style={{ flex: 1 }} />
                </View>
              </>
            ) : null}

            {game.phase === 'result' && card ? (
              <>
                <PopIn from="grow">
                  <View style={[styles.verdict, { backgroundColor: game.correct ? colors.lime : colors.coral }]}>
                    <Text style={styles.verdictText}>{game.correct ? t('correct') : t('notQuite')}</Text>
                    {game.correct ? <Text style={styles.verdictPoints}>+{RIDDLE_POINTS}</Text> : null}
                  </View>
                </PopIn>
                {game.correct ? null : (
                  <Text style={styles.hint}>
                    {t('answerIs')}: {card.answer?.text.replace(/\n/g, ' ')}
                  </Text>
                )}
                <Button variant="primary" label={t('continue')} onPress={table.next} style={styles.onDark} />
              </>
            ) : null}
          </View>
        </View>
      </FitScroll>

      <Panel visible={game.phase === 'over'} title={t('gameOver')}>
        <Text style={styles.winner}>{winners.length > 1 ? t('draw') : winners.length ? t('wins', { name: name(winners[0]) }) : ''}</Text>
        {game.scores
          .map((s, seat) => ({ s, seat }))
          .sort((a, b) => b.s - a.s)
          .map(({ s, seat }) => (
            <View key={seat} style={styles.finalRow}>
              <Text style={styles.finalName}>{name(seat)}</Text>
              <Text style={styles.finalScore}>{s}</Text>
            </View>
          ))}
        {/* For each learner at the table: today's goal. */}
        {table.learners.map((id) => {
          const who = profiles.find((p) => p.id === id);
          if (!who) return null;
          const done = Math.min(DAILY_GOAL, answeredOn(progressOf(id), dayNumber(new Date())));
          return (
            <View key={id} style={styles.reward}>
              <Avatar profile={who} size={28} />
              <Text style={styles.rewardName} numberOfLines={1}>
                {who.name ?? t('you')}
              </Text>
              <Text style={styles.rewardGoal}>
                {t('dailyGoal')}: {done}/{DAILY_GOAL}
              </Text>
              {done >= DAILY_GOAL ? <Ionicons name="checkmark-circle" size={18} color={colors.ink} /> : null}
            </View>
          );
        })}
        {/* The riddles nobody got, with their answers: the game teaches them. */}
        {game.missed.length ? (
          <>
            <Text style={styles.reviewTitle}>{t('riddlesMissed')}</Text>
            {game.missed.map((id) => {
              const c = cardOf(id);
              return (
                <View key={id} style={styles.missed}>
                  <Text style={styles.missedRiddle}>{c.riddle?.text.replace(/\n/g, ' ')}</Text>
                  <Text style={styles.missedAnswer}>{c.answer?.text.replace(/\n/g, ' ')}</Text>
                </View>
              );
            })}
          </>
        ) : null}
        <Button variant="lime" label={t('playAgain')} onPress={table.playAgain} />
        <Button variant="secondary" label={t('home')} onPress={nav.home} />
      </Panel>

      <LeaveConfirm visible={leaving} onLeave={nav.home} onStay={() => setLeaving(false)} />
      <HowToPlay game="ibisakuzo" deckId="ibisakuzo" visible={guide.visible} onClose={guide.close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  roles: { fontFamily: fonts.bold, fontSize: 15, color: theme.onBase, textAlign: 'center', marginTop: 10 },
  // Never shorter than the smallest card, so a very short screen scrolls instead of overlapping.
  stage: { flex: 1, minHeight: MIN_CARD_W / CARD_RATIO + 16, alignItems: 'center', justifyContent: 'center' },
  panel: { gap: 10, paddingBottom: 12 },
  sakwe: { fontFamily: fonts.display, fontSize: 34, color: theme.onBase, textAlign: 'center', letterSpacing: -0.5 },
  hint: { fontFamily: fonts.semibold, fontSize: 14, color: theme.onBase, textAlign: 'center', opacity: 0.9 },
  riddle: { fontFamily: fonts.card, fontSize: 21, lineHeight: 27, color: theme.onBase, textAlign: 'center' },
  answerBox: { backgroundColor: colors.lime, borderRadius: 20, padding: 14, alignItems: 'center', gap: 2 },
  answerLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
  answerText: { fontFamily: fonts.card, fontSize: 22, lineHeight: 28, color: colors.ink, textAlign: 'center' },
  judgeRow: { flexDirection: 'row', gap: 10 },
  verdict: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12 },
  verdictText: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  verdictPoints: { fontFamily: fonts.display, fontSize: 34, color: colors.ink, letterSpacing: -1 },
  onDark: { backgroundColor: colors.ink, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  winner: { fontFamily: fonts.display, fontSize: 22, color: colors.accent, textAlign: 'center' },
  finalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  finalScore: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 16, padding: 10 },
  rewardName: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  rewardGoal: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  reviewTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
  missed: { backgroundColor: colors.surface, borderRadius: radius.button, padding: 12, gap: 4 },
  missedRiddle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  missedAnswer: { fontFamily: fonts.card, fontSize: 15, color: theme.base },
});
