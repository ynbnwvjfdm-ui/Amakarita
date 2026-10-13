import { useState } from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { teamScores, trickWinner, winningTeams } from '../game/amaturufu';
import { PlayingCard } from '../game/cards';
import { backImage, cardImage, pageImage, getDeck } from '../decks';
import { useI18n } from '../i18n';
import { AmaturufuConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { LeaveConfirm, Panel, PassPhone, SUIT_COLOR, SUIT_SYMBOL, tableStyles } from '../ui/table';
import { colors, MAX_WIDTH } from '../ui/theme';
import { useAmaturufuTable } from './useAmaturufuTable';

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
    const taker = trickWinner(game.trick, game.trumpSuit).seat;
    status = taker === soloHuman && config.seats[taker].name === null ? t('youTookTrick') : t('tookTrick', { name: name(taker) });
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
    <SafeAreaView style={tableStyles.safe} edges={['top', 'bottom']}>
      <View style={[tableStyles.column, { width: W }]}>
        {/* Top bar: leave, trump, pile */}
        <View style={tableStyles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('leaveGame')} onPress={() => setLeaving(true)} hitSlop={12}>
            <Text style={tableStyles.close}>✕</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('trump')} ${SUIT_SYMBOL[game.trumpSuit]}`}
            onPress={() => setZoom(img(game.trumpCard))}
            style={styles.trump}
          >
            {game.stock.length > 0 ? <CardImage source={img(game.trumpCard)} width={40} /> : null}
            <View>
              <Text style={tableStyles.label}>{t('trump')}</Text>
              <Text style={[tableStyles.suit, { color: SUIT_COLOR[game.trumpSuit] }]}>{SUIT_SYMBOL[game.trumpSuit]}</Text>
            </View>
          </Pressable>
          <View style={styles.pile}>
            {game.stock.length > 1 ? <CardImage source={backImage(config.deckId)} width={30} /> : null}
            <Text style={styles.pileText}>{t('pile', { n: game.stock.length })}</Text>
          </View>
        </View>

        {/* Other players */}
        <View style={tableStyles.others}>
          {others.map((seat) => {
            const active = game.phase === 'playing' && game.turn === seat;
            return (
              <View key={seat} style={[tableStyles.badge, { width: badgeWidth }, active && tableStyles.badgeActive]}>
                <View style={tableStyles.badgeHead}>
                  {teamsMode ? <View style={[styles.dot, { backgroundColor: colors.teams[game.teams[seat]] }]} /> : null}
                  <Text style={tableStyles.badgeName} numberOfLines={1}>
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
          <Text style={[tableStyles.status, game.turn === viewer && game.phase === 'playing' && tableStyles.statusMine]}>{status}</Text>
        </View>

        {/* Cards of the person holding the phone */}
        <View style={styles.handArea}>
          {viewer !== null ? (
            <Text style={tableStyles.handName}>
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

      <PassPhone
        name={handoff !== null ? name(handoff) : null}
        cover={pageImage(config.deckId, deck.cover.page)}
        onAccept={table.acceptHandoff}
        onRequestClose={() => setLeaving(true)}
      />

      <Panel visible={game.phase === 'finished'} title={t('gameOver')}>
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
      </Panel>

      <LeaveConfirm visible={leaving} onLeave={nav.home} onStay={() => setLeaving(false)} />
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
      <Text style={tableStyles.headline}>{headline(winners)}</Text>
      {order.map(({ s, team }) => (
        <View key={team} style={tableStyles.scoreRow}>
          <Text style={[tableStyles.scoreName, winners.includes(team) && tableStyles.scoreHighlight]} numberOfLines={2}>
            {label(team)}
          </Text>
          <Text style={[tableStyles.scorePoints, winners.includes(team) && tableStyles.scoreHighlight]}>
            {s} <Text style={tableStyles.scoreUnit}>{pointsLabel.toLowerCase()}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trump: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pile: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pileText: { fontSize: 13, color: colors.tableMuted, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  backs: { flexDirection: 'row', gap: 3, minHeight: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  trick: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, minHeight: 120 },
  played: { alignItems: 'center', gap: 4 },
  playedName: { fontSize: 12, color: colors.tableMuted, maxWidth: 92 },
  winnerCard: { borderWidth: 3, borderColor: colors.highlight },
  handArea: { paddingBottom: 12, gap: 8 },
  hand: { flexDirection: 'row', justifyContent: 'center', gap: 12, minHeight: 150 },
  playable: { transform: [{ translateY: -6 }] },
});
