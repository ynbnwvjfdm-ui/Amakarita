import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatatuCard, matchWinner, topCard } from '../game/matatu';
import { SUITS, Suit } from '../game/cards';
import { CARD_RATIO, getDeck, pageImage } from '../decks';
import { useI18n } from '../i18n';
import { MatatuConfig, useNav } from '../navigation';
import { Button } from '../ui/Button';
import { ArtRef, CardArt } from '../ui/CardArt';
import { CardImage } from '../ui/CardImage';
import { CardViewer } from '../ui/CardViewer';
import { GameTopBar, InfoPill, PillText, PlayerChips } from '../ui/GameChrome';
import { HandGrid } from '../ui/HandGrid';
import { LeaveConfirm, Panel, PassPhone, SUIT_SYMBOL, tableStyles } from '../ui/table';
import { colors, deckTheme, fonts, MAX_WIDTH, radius } from '../ui/theme';
import { useMatatuTable } from './useMatatuTable';

const SUIT_ORDER = [...SUITS];
const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
/** Suit colours on white pills and panels. */
const SUIT_INK: Record<Suit, string> = { spades: colors.ink, clubs: colors.ink, hearts: '#D12C3A', diamonds: '#D12C3A' };

/** Hand shown grouped by suit, low to high, jokers last. */
function sortHand(hand: MatatuCard[]): MatatuCard[] {
  const key = (c: MatatuCard) => (c.suit === null ? 1000 : SUIT_ORDER.indexOf(c.suit) * 100 + RANK_ORDER.indexOf(c.rank));
  return hand.slice().sort((a, b) => key(a) - key(b));
}

export function MatatuGameScreen({ config }: { config: MatatuConfig }) {
  const { t } = useI18n();
  const nav = useNav();
  const table = useMatatuTable(config);
  const { game, viewer, spotlight, handoff, myTurn, owed, notice } = table;
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<MatatuCard | null>(null);
  const [zoom, setZoom] = useState<ArtRef | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [stageH, setStageH] = useState(0);
  const [handBox, setHandBox] = useState({ w: 0, h: 0 });

  const n = config.seats.length;
  const deck = getDeck(config.deckId);
  const theme = deckTheme(config.deckId);
  const art = (c: MatatuCard): ArtRef => ({ deckId: config.deckId, cardId: c.id });
  const soloHuman = table.humans.length === 1 ? table.humans[0] : null;
  const isYou = (seat: number) => seat === soloHuman && config.seats[seat].name === null;
  const name = (seat: number) => config.seats[seat].name ?? (seat === soloHuman ? t('you') : t('playerN', { n: seat + 1 }));
  const label = (c: MatatuCard) => (c.rank === 'joker' ? 'Joker' : `${c.rank} ${SUIT_SYMBOL[c.suit!]}`);

  const me = viewer ?? table.humans[0];
  const others = Array.from({ length: n - 1 }, (_, i) => (me + 1 + i) % n);
  const W = Math.min(width, MAX_WIDTH);
  // Both piles side by side, as big as the measured middle allows. Besides the
  // piles it holds the chips under them (38), the status line (40) and gaps.
  const pileW = Math.max(56, Math.min(136, (W - 32 - 40) / 2.4, stageH > 0 ? (stageH - 104) * CARD_RATIO : 100));
  const pileH = pileW / CARD_RATIO;

  const top = topCard(game);
  const hand = viewer !== null ? sortHand(game.hands[viewer]) : [];
  const choosing = myTurn && !spotlight;
  const canPick = choosing && (game.phase === 'play' || game.phase === 'queen');
  const over = game.phase === 'roundOver' || game.phase === 'matchOver';

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

  const noticeText = !notice
    ? null
    : notice.kind === 'said'
      ? t('said', { name: name(notice.seat), word: t(notice.word) })
      : notice.kind === 'caught'
        ? isYou(notice.seat)
          ? t('youCaught', { n: 2 })
          : t('caught', { name: name(notice.seat), n: 2 })
        : isYou(notice.seat)
          ? t('youWrongCard', { n: 1 })
          : t('wrongCard', { name: name(notice.seat), n: 1 });

  const result = game.roundResult;
  const winner = matchWinner(game);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.base }]} edges={['top', 'bottom']}>
      <View style={[styles.column, { width: W }]}>
        <GameTopBar
          onLeave={() => setLeaving(true)}
          leaveLabel={t('leaveGame')}
          center={
            <Pressable accessibilityRole="button" onPress={() => setZoom(art(game.cutCard))}>
              <InfoPill label={`${t('cut')} ${SUIT_SYMBOL[game.cutSuit]}`}>
                <Ionicons name="cut-outline" size={16} color={colors.ink} />
                <PillText>{t('cut')}</PillText>
                <PillText color={SUIT_INK[game.cutSuit]}>{SUIT_SYMBOL[game.cutSuit]}</PillText>
              </InfoPill>
            </Pressable>
          }
        />

        <PlayerChips
          width={W - 32}
          players={others.map((seat) => {
            const count = game.hands[seat].length;
            const out = !game.inMatch[seat];
            const safe = game.inMatch[seat] && !game.inRound[seat];
            const said = table.said[seat];
            return {
              key: seat,
              name: name(seat),
              value: count,
              active: game.turn === seat && !over,
              dim: out,
              badge: said === 'warning' && count === 2 ? '2!' : said === 'oneCard' && count === 1 ? '1!' : null,
              state: out ? t('outBadge') : safe ? t('safe') : null,
            };
          })}
        />

        {/* The two piles */}
        <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setStageH(e.nativeEvent.layout.height)}>
          <View style={styles.piles}>
            <View style={styles.pileCol}>
              {game.stock.length > 0 ? <CardImage source={pageImage(config.deckId, deck.cover.page)} width={pileW} /> : <View style={[styles.empty, { width: pileW, height: pileH }]} />}
              <Text style={[styles.pileLabel, { color: theme.onBase }]}>{t('pile', { n: game.stock.length })}</Text>
            </View>
            <View style={styles.pileCol}>
              {top ? (
                <Pressable accessibilityRole="button" accessibilityLabel={label(top)} onPress={() => setZoom(art(top))}>
                  <CardArt {...art(top)} width={pileW} />
                </Pressable>
              ) : (
                <View style={[styles.empty, { width: pileW, height: pileH }]} />
              )}
              <View style={styles.pileInfo}>
                {game.activeSuit && top && (top.suit !== game.activeSuit || top.rank === 'A') ? (
                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>{t('askedSuit')}</Text>
                    <Text style={[styles.infoChipSuit, { color: SUIT_INK[game.activeSuit] }]}>{SUIT_SYMBOL[game.activeSuit]}</Text>
                  </View>
                ) : null}
                {game.pickup ? (
                  <View style={[styles.infoChip, { backgroundColor: colors.coral }]}>
                    <Text style={styles.infoChipText}>+{game.pickup.total}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          {/* A notice takes the status line's place for a moment. */}
          <View style={styles.statusSlot}>
            {noticeText ? (
              <Text style={styles.notice}>{noticeText}</Text>
            ) : (
              <Text style={[styles.status, { color: game.turn === viewer ? colors.lime : theme.onBase }]} numberOfLines={2}>
                {status}
              </Text>
            )}
          </View>
        </View>

        {/* The hand of the person holding the phone */}
        <View style={styles.handArea}>
          {owed && owed.seat === viewer ? <Button variant="lime" label={t(owed.word)} onPress={table.sayIt} style={styles.wide} /> : null}
          {viewer !== null ? (
            <Text style={[styles.handName, { color: theme.onBase }]}>
              {name(viewer)} · {t('cardsCount', { n: hand.length })}
            </Text>
          ) : null}
          <View style={styles.handBox} onLayout={(e: LayoutChangeEvent) => setHandBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
            <HandGrid
              deckId={config.deckId}
              cards={hand.map((c) => ({ id: c.id, label: label(c) }))}
              width={handBox.w}
              height={handBox.h}
              maxCardWidth={104}
              onPress={(id) => {
                const c = hand.find((x) => x.id === id)!;
                if (choosing && (game.phase === 'play' || game.phase === 'queen')) setPreview(c);
                else setZoom(art(c));
              }}
            />
          </View>
          <View style={styles.actions}>
            <Button
              variant="secondary"
              label={game.pickup && game.phase === 'play' ? t('pickN', { n: game.pickup.total }) : t('pickCard')}
              onPress={table.pick}
              disabled={!canPick}
              style={styles.wide}
            />
          </View>
        </View>
      </View>

      <CardViewer art={spotlight ? art(spotlight.card) : null} caption={spotlight ? name(spotlight.seat) : undefined} onClose={table.dismissSpotlight} />

      <CardViewer
        art={preview ? art(preview) : null}
        onClose={() => setPreview(null)}
        actions={
          <>
            <Button label={t('cancel')} variant="secondary" onPress={() => setPreview(null)} />
            <Button
              variant="lime"
              label={t('playThisCard')}
              onPress={() => {
                if (preview) table.play(preview);
                setPreview(null);
              }}
            />
          </>
        }
      />

      <CardViewer art={zoom} onClose={() => setZoom(null)} />

      {/* After picking: play the card or keep it. Nothing says whether it fits. */}
      <CardViewer
        art={choosing && game.phase === 'drawn' && game.drawn ? art(game.drawn) : null}
        caption={t('pickedCard')}
        onClose={table.keep}
        actions={
          <>
            <Button label={t('keepIt')} variant="secondary" onPress={table.keep} />
            <Button variant="lime" label={t('playIt')} onPress={() => game.drawn && table.play(game.drawn)} />
          </>
        }
      />

      <Panel visible={choosing && game.phase === 'chooseSuit'} title={t('chooseSuit')}>
        <View style={styles.suits}>
          {SUITS.map((s) => (
            <Pressable key={s} accessibilityRole="button" accessibilityLabel={s} onPress={() => table.choose(s)} style={styles.suitButton}>
              <Text style={[styles.suitButtonText, { color: SUIT_INK[s] }]}>{SUIT_SYMBOL[s]}</Text>
            </Pressable>
          ))}
        </View>
      </Panel>

      <Panel visible={choosing && game.phase === 'confirmCut'} title={t('cutQuestion')}>
        <Text style={tableStyles.body}>{t('cutExplain')}</Text>
        <Button variant="lime" label={t('cutYes')} onPress={() => table.cut(true)} />
        <Button label={t('cutNo')} variant="secondary" onPress={() => table.cut(false)} />
      </Panel>

      <PassPhone
        name={handoff !== null ? name(handoff) : null}
        cover={pageImage(config.deckId, deck.cover.page)}
        onAccept={table.acceptHandoff}
        onRequestClose={() => setLeaving(true)}
      >
        {owed && owed.seat !== handoff ? <Button label={`${name(owed.seat)}: ${t(owed.word)}`} variant="secondary" onPress={table.sayIt} /> : null}
      </PassPhone>

      <Panel visible={!spotlight && over} title={winner !== null ? t('gameOver') : t('roundOver', { n: game.round })}>
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
            <Text style={tableStyles.headline}>{isYou(winner) ? t('youWin') : t('wins', { name: name(winner) })}</Text>
            <Button variant="lime" label={t('playAgain')} onPress={table.playAgain} />
            <Button label={t('home')} variant="secondary" onPress={nav.home} />
          </>
        ) : (
          <Button variant="lime" label={t('nextRound')} onPress={table.nextRound} />
        )}
      </Panel>

      <LeaveConfirm visible={leaving} onLeave={nav.home} onStay={() => setLeaving(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  statusSlot: { height: 40, justifyContent: 'center', alignItems: 'center' },
  notice: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, backgroundColor: colors.lime, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, overflow: 'hidden' },
  piles: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 28 },
  pileCol: { alignItems: 'center', gap: 10 },
  empty: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  pileLabel: { fontFamily: fonts.semibold, fontSize: 12, opacity: 0.85 },
  pileInfo: { flexDirection: 'row', gap: 6, minHeight: 28 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 10, height: 28 },
  infoChipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  infoChipSuit: { fontFamily: fonts.display, fontSize: 16 },
  status: { fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  // Shares the space below the chips with the piles.
  handArea: { flex: 1.15, gap: 8, paddingBottom: 10 },
  handBox: { flex: 1, justifyContent: 'center' },
  handName: { fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center', opacity: 0.85 },
  actions: { flexDirection: 'row', gap: 10 },
  wide: { flex: 1 },
  suits: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  suitButton: { flex: 1, aspectRatio: 1, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  suitButtonText: { fontSize: 40, fontFamily: fonts.display },
});
