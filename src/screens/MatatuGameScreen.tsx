import { useState } from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatatuCard, canPlay, matchWinner, topCard } from '../game/matatu';
import { SUITS } from '../game/cards';
import { backImage, cardImage, getDeck, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { MatatuConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { LeaveConfirm, Panel, PassPhone, SUIT_COLOR, SUIT_SYMBOL, tableStyles } from '../ui/table';
import { colors, MAX_WIDTH, radius, fonts } from '../ui/theme';
import { useMatatuTable } from './useMatatuTable';

const HAND_CARD = 84;
const SUIT_ORDER = [...SUITS];
const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** Hand shown grouped by suit, low to high, jokers last. */
function sortHand(hand: MatatuCard[]): MatatuCard[] {
  const key = (c: MatatuCard) =>
    c.suit === null ? 1000 : SUIT_ORDER.indexOf(c.suit) * 100 + RANK_ORDER.indexOf(c.rank);
  return hand.slice().sort((a, b) => key(a) - key(b));
}

export function MatatuGameScreen({ config }: { config: MatatuConfig }) {
  const { t } = useI18n();
  const nav = useNav();
  const table = useMatatuTable(config);
  const { game, viewer, spotlight, handoff, myTurn, owed, notice } = table;
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<MatatuCard | null>(null);
  const [zoom, setZoom] = useState<ImageSourcePropType | null>(null);
  const [leaving, setLeaving] = useState(false);

  const n = config.seats.length;
  const deck = getDeck(config.deckId);
  const img = (c: MatatuCard) => cardImage(config.deckId, c.id);
  const soloHuman = table.humans.length === 1 ? table.humans[0] : null;
  const name = (seat: number) =>
    config.seats[seat].name ?? (seat === soloHuman ? t('you') : t('playerN', { n: seat + 1 }));
  const word = (w: 'warning' | 'oneCard') => t(w);
  // "You" needs its own sentence in Kinyarwanda, not the third person.
  const isYou = (seat: number) => seat === soloHuman && config.seats[seat].name === null;

  const me = viewer ?? table.humans[0];
  const others = Array.from({ length: n - 1 }, (_, i) => (me + 1 + i) % n);
  const W = Math.min(width, MAX_WIDTH);
  const perRow = Math.min(3, n - 1);
  const badgeWidth = Math.min(116, (W - 32 - 8 * (perRow - 1)) / perRow);

  const top = topCard(game);
  const hand = viewer !== null ? sortHand(game.hands[viewer]) : [];
  // Overlap the hand so every card stays on screen.
  const step = hand.length > 1 ? Math.min(HAND_CARD + 6, (W - 32 - HAND_CARD) / (hand.length - 1)) : 0;
  const choosing = myTurn && !spotlight;
  const canPick = choosing && (game.phase === 'play' || game.phase === 'queen');

  let status: string;
  if (game.pickup && game.phase === 'play') {
    status = game.turn === viewer ? `${t('yourTurn')} · ${t('pickupWaiting', { n: game.pickup.total })}` : t('pickupWaiting', { n: game.pickup.total });
  } else if (game.phase === 'queen' && game.queenSuit) {
    status = game.turn === viewer ? `${t('yourTurn')} · ${t('queenFollow', { suit: SUIT_SYMBOL[game.queenSuit] })}` : t('turnOf', { name: name(game.turn) });
  } else if (game.turn === viewer) {
    status = t('yourTurn');
  } else {
    status = t('turnOf', { name: name(game.turn) });
  }

  const noticeText = notice
    ? notice.kind === 'said'
      ? t('said', { name: name(notice.seat), word: word(notice.word) })
      : isYou(notice.seat)
        ? t('youCaught', { n: 2 })
        : t('caught', { name: name(notice.seat), n: 2 })
    : null;

  const result = game.roundResult;
  const winner = matchWinner(game);

  return (
    <SafeAreaView style={tableStyles.safe} edges={['top', 'bottom']}>
      <View style={[tableStyles.column, { width: W }]}>
        {/* Top bar: leave, cut suit, pile */}
        <View style={tableStyles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('leaveGame')} onPress={() => setLeaving(true)} hitSlop={12}>
            <Text style={tableStyles.close}>✕</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('cut')} ${SUIT_SYMBOL[game.cutSuit]}`}
            onPress={() => setZoom(img(game.cutCard))}
            style={styles.row}
          >
            {game.stock.includes(game.cutCard) ? <CardImage source={img(game.cutCard)} width={40} /> : null}
            <View>
              <Text style={tableStyles.label}>{t('cut')}</Text>
              <Text style={[tableStyles.suit, { color: SUIT_COLOR[game.cutSuit] }]}>{SUIT_SYMBOL[game.cutSuit]}</Text>
            </View>
          </Pressable>
          <View style={styles.row}>
            {game.stock.length > 1 ? <CardImage source={backImage(config.deckId)} width={30} /> : null}
            <Text style={styles.pileText}>{t('pile', { n: game.stock.length })}</Text>
          </View>
        </View>

        {/* Other players */}
        <View style={tableStyles.others}>
          {others.map((seat) => {
            const active = game.turn === seat && game.phase !== 'roundOver' && game.phase !== 'matchOver';
            const count = game.hands[seat].length;
            const out = !game.inMatch[seat];
            const safe = game.inMatch[seat] && !game.inRound[seat];
            const chip = table.said[seat] === 'warning' && count === 2 ? '2!' : table.said[seat] === 'oneCard' && count === 1 ? '1!' : null;
            return (
              <View key={seat} style={[tableStyles.badge, { width: badgeWidth }, active && tableStyles.badgeActive, out && styles.badgeOut]}>
                <View style={tableStyles.badgeHead}>
                  <Text style={tableStyles.badgeName} numberOfLines={1}>
                    {name(seat)}
                  </Text>
                  {chip ? <Text style={styles.chip}>{chip}</Text> : null}
                </View>
                <View style={styles.row}>
                  {out || safe ? (
                    <Text style={styles.badgeState}>{out ? t('outBadge') : t('safe')}</Text>
                  ) : (
                    <>
                      <CardImage source={backImage(config.deckId)} width={16} />
                      <Text style={styles.count}>{count}</Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* The played pile */}
        <View style={styles.center}>
          {noticeText ? <Text style={styles.notice}>{noticeText}</Text> : null}
          <View style={styles.pileRow}>
            {top ? (
              <Pressable accessibilityRole="button" onPress={() => setZoom(img(top))}>
                <CardImage source={img(top)} width={112} />
              </Pressable>
            ) : (
              <View style={styles.emptyPile} />
            )}
            <View style={styles.pileInfo}>
              {game.activeSuit && top && (top.suit !== game.activeSuit || top.rank === 'A') ? (
                <View style={styles.asked}>
                  <Text style={tableStyles.label}>{t('askedSuit')}</Text>
                  <Text style={[styles.askedSuit, { color: SUIT_COLOR[game.activeSuit] }]}>{SUIT_SYMBOL[game.activeSuit]}</Text>
                </View>
              ) : null}
              {game.pickup ? <Text style={styles.pickup}>+{game.pickup.total}</Text> : null}
            </View>
          </View>
          <Text style={[tableStyles.status, game.turn === viewer && tableStyles.statusMine]}>{status}</Text>
        </View>

        {/* The hand of the person holding the phone */}
        <View style={styles.handArea}>
          {owed && owed.seat === viewer ? (
            <Button label={t(owed.word)} onPress={table.sayIt} style={styles.sayIt} />
          ) : null}
          {viewer !== null ? <Text style={tableStyles.handName}>{name(viewer)}</Text> : null}
          <View style={[styles.hand, { width: hand.length ? HAND_CARD + step * (hand.length - 1) : 0 }]}>
            {hand.map((c, i) => {
              const ok = choosing && canPlay(game, c);
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={c.rank === 'joker' ? 'Joker' : `${c.rank} ${SUIT_SYMBOL[c.suit!]}`}
                  accessibilityState={{ disabled: choosing && !ok }}
                  onPress={() => (ok ? setPreview(c) : setZoom(img(c)))}
                  style={[styles.handCard, { left: i * step }, ok && styles.playable]}
                >
                  <CardImage source={img(c)} width={HAND_CARD} />
                  {choosing && !ok ? <View style={styles.shade} /> : null}
                </Pressable>
              );
            })}
          </View>
          {canPick ? (
            <Button
              label={game.pickup && game.phase === 'play' ? t('pickN', { n: game.pickup.total }) : t('pickCard')}
              variant="secondary"
              onPress={table.pick}
            />
          ) : (
            <View style={styles.pickSpacer} />
          )}
        </View>
      </View>

      <CardViewer
        source={spotlight ? img(spotlight.card) : null}
        caption={spotlight ? name(spotlight.seat) : undefined}
        onClose={table.dismissSpotlight}
      />

      <CardViewer
        source={preview ? img(preview) : null}
        onClose={() => setPreview(null)}
        actions={
          <>
            <Button label={t('cancel')} variant="secondary" onPress={() => setPreview(null)} />
            <Button
              label={t('playThisCard')}
              onPress={() => {
                if (preview) table.play(preview);
                setPreview(null);
              }}
            />
          </>
        }
      />

      <CardViewer source={zoom} onClose={() => setZoom(null)} />

      {/* Picked a card that fits */}
      <CardViewer
        source={choosing && game.phase === 'drawn' && game.drawn ? img(game.drawn) : null}
        caption={t('drawnFits')}
        onClose={table.keep}
        actions={
          <>
            <Button label={t('keepIt')} variant="secondary" onPress={table.keep} />
            <Button label={t('playIt')} onPress={() => game.drawn && table.play(game.drawn)} />
          </>
        }
      />

      <Panel visible={choosing && game.phase === 'chooseSuit'} title={t('chooseSuit')}>
        <View style={styles.suits}>
          {SUITS.map((s) => (
            <Pressable key={s} accessibilityRole="button" accessibilityLabel={s} onPress={() => table.choose(s)} style={styles.suitButton}>
              <Text style={[styles.suitButtonText, { color: s === 'hearts' || s === 'diamonds' ? colors.accent : colors.ink }]}>
                {SUIT_SYMBOL[s]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Panel>

      <Panel visible={choosing && game.phase === 'confirmCut'} title={t('cutQuestion')}>
        <Text style={tableStyles.body}>{t('cutExplain')}</Text>
        <Button label={t('cutYes')} onPress={() => table.cut(true)} />
        <Button label={t('cutNo')} variant="secondary" onPress={() => table.cut(false)} />
      </Panel>

      <PassPhone
        name={handoff !== null ? name(handoff) : null}
        cover={pageImage(config.deckId, deck.cover.page)}
        onAccept={table.acceptHandoff}
        onRequestClose={() => setLeaving(true)}
      >
        {owed && owed.seat !== handoff ? (
          <Button label={`${name(owed.seat)}: ${t(owed.word)}`} variant="secondary" onPress={table.sayIt} />
        ) : null}
      </PassPhone>

      <Panel
        visible={!spotlight && (game.phase === 'roundOver' || game.phase === 'matchOver')}
        title={winner !== null ? t('gameOver') : t('roundOver', { n: game.round })}
      >
        {result ? (
          <Text style={tableStyles.body}>
            {result.reason === 'cut'
              ? isYou(result.out)
                ? t('outCutYou', { cutter: name(result.cutter!) })
                : isYou(result.cutter!)
                  ? t('youCut', { name: name(result.out) })
                  : t('outCut', { cutter: name(result.cutter!), name: name(result.out) })
              : isYou(result.out)
                ? t('outLastYou')
                : t('outLast', { name: name(result.out) })}
          </Text>
        ) : null}
        {result?.points
          ? result.points
              .map((p, seat) => ({ p, seat }))
              .filter(({ seat }) => game.inRound[seat] || seat === result.out)
              .sort((a, b) => b.p - a.p)
              .map(({ p, seat }) => (
                <View key={seat} style={tableStyles.scoreRow}>
                  <Text style={[tableStyles.scoreName, seat === result.out && tableStyles.scoreHighlight]}>{name(seat)}</Text>
                  <Text style={[tableStyles.scorePoints, seat === result.out && tableStyles.scoreHighlight]}>
                    {p} <Text style={tableStyles.scoreUnit}>{t('points').toLowerCase()}</Text>
                  </Text>
                </View>
              ))
          : null}
        {winner !== null ? (
          <>
            <Text style={tableStyles.headline}>
              {isYou(winner) ? t('youWin') : t('wins', { name: name(winner) })}
            </Text>
            <Button label={t('playAgain')} onPress={table.playAgain} />
            <Button label={t('home')} variant="secondary" onPress={nav.home} />
          </>
        ) : (
          <Button label={t('nextRound')} onPress={table.nextRound} />
        )}
      </Panel>

      <LeaveConfirm visible={leaving} onLeave={nav.home} onStay={() => setLeaving(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pileText: { fontSize: 13, color: colors.tableMuted, fontFamily: fonts.semibold },
  badgeOut: { opacity: 0.45 },
  badgeState: { fontSize: 12, fontFamily: fonts.bold, color: colors.tableMuted },
  count: { fontSize: 15, fontFamily: fonts.display, color: colors.tableInk },
  chip: { fontSize: 11, fontFamily: fonts.display, color: colors.table, backgroundColor: colors.highlight, borderRadius: 8, paddingHorizontal: 5, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  notice: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.table,
    backgroundColor: colors.highlight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emptyPile: { width: 112, height: 153, borderRadius: radius.card, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed' },
  pileInfo: { gap: 10, alignItems: 'center', minWidth: 56 },
  asked: { alignItems: 'center' },
  askedSuit: { fontSize: 34, fontFamily: fonts.display },
  pickup: { fontSize: 26, fontFamily: fonts.display, color: '#FF6B6B' },
  handArea: { paddingBottom: 12, gap: 8, alignItems: 'center' },
  sayIt: { alignSelf: 'stretch' },
  hand: { height: HAND_CARD / 0.732 + 10, position: 'relative' },
  handCard: { position: 'absolute', top: 10 },
  playable: { top: 0 },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.card },
  pickSpacer: { height: 48 },
  suits: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  suitButton: { flex: 1, aspectRatio: 1, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  suitButtonText: { fontSize: 40, fontFamily: fonts.display },
});
