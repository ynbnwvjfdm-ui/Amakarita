import { useState } from 'react';
import { ImageSourcePropType, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { teamScores, trickWinner, winningTeams } from '../game/amaturufu';
import { PlayingCard, Suit } from '../game/cards';
import { backImage, cardImage, pageImage, getDeck } from '../decks';
import { useI18n } from '../i18n';
import { AmaturufuConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { colors, MAX_WIDTH, radius } from '../ui/theme';
import { useAmaturufuTable } from './useAmaturufuTable';

// Text presentation selector (U+FE0E) keeps phones from drawing emoji hearts.
const SUIT_SYMBOL: Record<Suit, string> = { spades: '♠\uFE0E', hearts: '♥\uFE0E', clubs: '♣\uFE0E', diamonds: '♦\uFE0E' };
const SUIT_COLOR: Record<Suit, string> = { spades: '#FFFFFF', hearts: '#FF6B6B', clubs: '#FFFFFF', diamonds: '#FF6B6B' };

export function AmaturufuGameScreen({ config }: { config: AmaturufuConfig }) {
  const { t } = useI18n();
  const nav = useNav();
  const table = useAmaturufuTable(config);
  const { game, viewer, spotlight, handoff, myTurn } = table;
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<PlayingCard | null>(null);
  const [zoom, setZoom] = useState<ImageSourcePropType | null>(null);
  const [leaving, setLeaving] = useState(false);

  const n = config.playerCount;
  const teamsMode = config.teamMode === 'teams';
  const deck = getDeck(config.deckId);
  const img = (c: PlayingCard) => cardImage(config.deckId, c.id);
  const soloHuman = table.humans.length === 1 ? table.humans[0] : null;
  const name = (seat: number) =>
    config.seats[seat].name ?? (seat === soloHuman ? t('you') : t('playerN', { n: seat + 1 }));
  const teamName = (team: number) => t('team', { n: team + 1 });

  // Everyone else, in turn order starting from the seat after the one on show.
  const me = viewer ?? table.humans[0];
  const others = Array.from({ length: n - 1 }, (_, i) => (me + 1 + i) % n);

  const W = Math.min(width, MAX_WIDTH);
  const handWidth = Math.min(116, (W - 32 - 24) / 3);
  const trickWidth = n <= 2 ? 92 : n <= 4 ? 76 : 62;
  // Up to three other players per row; with 6 players they wrap to two rows.
  const perRow = Math.min(3, n - 1);
  const badgeWidth = Math.min(116, (W - 32 - 8 * (perRow - 1)) / perRow);

  let status: string;
  if (game.phase === 'trickComplete') {
    status = t('tookTrick', { name: name(trickWinner(game.trick, game.trumpSuit).seat) });
  } else if (game.turn === viewer) {
    status = myTurn ? `${t('yourTurn')} · ${t('tapToPlay')}` : t('yourTurn');
  } else {
    status = t('turnOf', { name: name(game.turn) });
  }
  const trickWinnerSeat = game.phase === 'trickComplete' ? trickWinner(game.trick, game.trumpSuit).seat : null;

  const tapHandCard = (c: PlayingCard) => {
    if (myTurn) setPreview(c);
    else setZoom(img(c));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.column, { width: W }]}>
        {/* Top bar: leave, trump, pile */}
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('leaveGame')} onPress={() => setLeaving(true)} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('trump')} ${SUIT_SYMBOL[game.trumpSuit]}`}
            onPress={() => setZoom(img(game.trumpCard))}
            style={styles.trump}
          >
            {game.stock.length > 0 ? <CardImage source={img(game.trumpCard)} width={40} /> : null}
            <View>
              <Text style={styles.trumpLabel}>{t('trump')}</Text>
              <Text style={[styles.trumpSuit, { color: SUIT_COLOR[game.trumpSuit] }]}>{SUIT_SYMBOL[game.trumpSuit]}</Text>
            </View>
          </Pressable>
          <View style={styles.pile}>
            {game.stock.length > 1 ? <CardImage source={backImage(config.deckId)} width={30} /> : null}
            <Text style={styles.pileText}>{t('pile', { n: game.stock.length })}</Text>
          </View>
        </View>

        {/* Other players */}
        <View style={styles.others}>
          {others.map((seat) => {
            const active = game.phase === 'playing' && game.turn === seat;
            return (
              <View key={seat} style={[styles.badge, { width: badgeWidth }, active && styles.badgeActive]}>
                <View style={styles.badgeHead}>
                  {teamsMode ? <View style={[styles.dot, { backgroundColor: colors.teams[game.teams[seat]] }]} /> : null}
                  <Text style={styles.badgeName} numberOfLines={1}>
                    {name(seat)}
                  </Text>
                </View>
                <View style={styles.backs}>
                  {game.hands[seat].map((c) => (
                    <CardImage key={c.id} source={backImage(config.deckId)} width={16} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* The trick being played */}
        <View style={styles.center}>
          <View style={styles.trick}>
            {game.trick.map((p) => (
              <Pressable key={p.card.id} accessibilityRole="button" onPress={() => setZoom(img(p.card))} style={styles.played}>
                <CardImage
                  source={img(p.card)}
                  width={trickWidth}
                  style={p.seat === trickWinnerSeat ? styles.winnerCard : undefined}
                />
                <Text style={styles.playedName} numberOfLines={1}>
                  {name(p.seat)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.status, game.turn === viewer && game.phase === 'playing' && styles.statusMine]}>{status}</Text>
        </View>

        {/* Cards of the person holding the phone */}
        <View style={styles.handArea}>
          {viewer !== null ? (
            <Text style={styles.handName}>
              {teamsMode ? `${name(viewer)} · ${teamName(game.teams[viewer])}` : name(viewer)}
            </Text>
          ) : null}
          <View style={styles.hand}>
            {viewer !== null
              ? game.hands[viewer].map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.rank} ${SUIT_SYMBOL[c.suit]}`}
                    onPress={() => tapHandCard(c)}
                    style={({ pressed }) => [myTurn && styles.playable, pressed && { opacity: 0.85 }]}
                  >
                    <CardImage source={img(c)} width={handWidth} />
                  </Pressable>
                ))
              : null}
          </View>
        </View>
      </View>

      {/* A card just played, shown large so its words can be read */}
      <CardViewer
        source={spotlight ? img(spotlight.card) : null}
        caption={spotlight ? name(spotlight.seat) : undefined}
        onClose={table.dismissSpotlight}
      />

      {/* Confirm before playing a card from the hand */}
      <CardViewer
        source={preview ? img(preview) : null}
        onClose={() => setPreview(null)}
        actions={
          <>
            <Button label={t('cancel')} variant="secondary" onPress={() => setPreview(null)} />
            <Button
              label={t('playThisCard')}
              onPress={() => {
                if (preview) table.playMine(preview);
                setPreview(null);
              }}
            />
          </>
        }
      />

      <CardViewer source={zoom} onClose={() => setZoom(null)} />

      {/* Pass the phone */}
      <Modal visible={handoff !== null} animationType="fade" onRequestClose={() => setLeaving(true)}>
        <SafeAreaView style={[styles.safe, styles.handoff]}>
          <CardImage source={pageImage(config.deckId, deck.cover.page)} width={120} />
          <Text style={styles.handoffTitle}>{handoff !== null ? t('passPhoneTo', { name: name(handoff) }) : ''}</Text>
          <Text style={styles.handoffNote}>{t('dontLook')}</Text>
          <Button label={handoff !== null ? t('showMyCards', { name: name(handoff) }) : ''} onPress={table.acceptHandoff} />
        </SafeAreaView>
      </Modal>

      {/* Results */}
      <Modal visible={game.phase === 'finished'} transparent animationType="fade">
        <View style={styles.dim}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('gameOver')}</Text>
            <Results
              scores={teamScores(game)}
              winners={winningTeams(game)}
              label={(team) =>
                teamsMode
                  ? `${teamName(team)} (${game.teams.flatMap((tm, s) => (tm === team ? [name(s)] : [])).join(', ')})`
                  : name(team)
              }
              headline={(winners) =>
                winners.length > 1
                  ? t('draw')
                  : teamsMode
                    ? t('teamWins', { name: teamName(winners[0]) })
                    : winners[0] === soloHuman && config.seats[winners[0]].name === null
                      ? t('youWin')
                      : t('wins', { name: name(winners[0]) })
              }
              pointsLabel={t('points')}
            />
            <Button label={t('playAgain')} onPress={table.playAgain} />
            <Button label={t('home')} variant="secondary" onPress={nav.home} />
          </View>
        </View>
      </Modal>

      {/* Leave confirmation */}
      <Modal visible={leaving} transparent animationType="fade" onRequestClose={() => setLeaving(false)}>
        <View style={styles.dim}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('leaveConfirm')}</Text>
            <Button label={t('yes')} onPress={nav.home} />
            <Button label={t('no')} variant="secondary" onPress={() => setLeaving(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Results({
  scores,
  winners,
  label,
  headline,
  pointsLabel,
}: {
  scores: number[];
  winners: number[];
  label: (team: number) => string;
  headline: (winners: number[]) => string;
  pointsLabel: string;
}) {
  const order = scores.map((s, team) => ({ s, team })).sort((a, b) => b.s - a.s);
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.headline}>{headline(winners)}</Text>
      {order.map(({ s, team }) => (
        <View key={team} style={styles.scoreRow}>
          <Text style={[styles.scoreName, winners.includes(team) && styles.scoreWinner]} numberOfLines={2}>
            {label(team)}
          </Text>
          <Text style={[styles.scorePoints, winners.includes(team) && styles.scoreWinner]}>
            {s} <Text style={styles.scoreUnit}>{pointsLabel.toLowerCase()}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.table },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  close: { fontSize: 22, color: colors.tableInk, paddingHorizontal: 4 },
  trump: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trumpLabel: { fontSize: 12, fontWeight: '700', color: colors.tableMuted, textTransform: 'uppercase' },
  trumpSuit: { fontSize: 24, fontWeight: '800' },
  pile: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pileText: { fontSize: 13, color: colors.tableMuted, fontWeight: '600' },
  others: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 },
  badge: { padding: 6, borderRadius: radius.button, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'transparent', gap: 6 },
  badgeActive: { borderColor: colors.highlight },
  badgeHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  badgeName: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.tableInk },
  backs: { flexDirection: 'row', gap: 3, minHeight: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  trick: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, minHeight: 120 },
  played: { alignItems: 'center', gap: 4 },
  playedName: { fontSize: 12, color: colors.tableMuted, maxWidth: 92 },
  winnerCard: { borderWidth: 3, borderColor: colors.highlight },
  status: { fontSize: 16, fontWeight: '600', color: colors.tableInk, textAlign: 'center' },
  statusMine: { color: colors.highlight },
  handArea: { paddingBottom: 12, gap: 8 },
  handName: { fontSize: 14, fontWeight: '700', color: colors.tableMuted, textAlign: 'center' },
  hand: { flexDirection: 'row', justifyContent: 'center', gap: 12, minHeight: 150 },
  playable: { transform: [{ translateY: -6 }] },
  handoff: { alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  handoffTitle: { fontSize: 26, fontWeight: '800', color: colors.tableInk, textAlign: 'center' },
  handoffNote: { fontSize: 16, color: colors.tableMuted, textAlign: 'center' },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { width: '100%', maxWidth: 400, backgroundColor: colors.bg, borderRadius: radius.panel, padding: 20, gap: 12 },
  panelTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  headline: { fontSize: 18, fontWeight: '700', color: colors.accent, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  scoreName: { flex: 1, fontSize: 15, color: colors.ink },
  scorePoints: { fontSize: 20, fontWeight: '800', color: colors.ink },
  scoreUnit: { fontSize: 12, fontWeight: '600', color: colors.muted },
  scoreWinner: { color: colors.accent },
});
