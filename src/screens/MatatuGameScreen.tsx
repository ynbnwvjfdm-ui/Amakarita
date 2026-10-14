import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { FitScroll } from '../ui/FitScroll';
import { GameTopBar, InfoPill, PillText, PlayerChips } from '../ui/GameChrome';
import { HandRow } from '../ui/HandRow';
import { HelpButton, HowToPlay, useGuide } from '../ui/HowToPlay';
import { feel, PopIn, useShake } from '../ui/motion';
import { LeaveConfirm, Panel, PassPhone, SUIT_SYMBOL, tableStyles } from '../ui/table';
import { colors, deckTheme, fonts, MAX_WIDTH, radius } from '../ui/theme';
import { useMatatuTable } from './useMatatuTable';

const SUIT_ORDER = [...SUITS];
const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
/** Suit colours on white pills and panels. */
const SUIT_INK: Record<Suit, string> = { spades: colors.ink, clubs: colors.ink, hearts: '#D12C3A', diamonds: '#D12C3A' };

// The middle of the table: two piles and a status column, in one row.
const STAGE_GAP = 12;
const STAGE_LABEL = 26;
const INFO_MIN_W = 110;
const MIN_PILE_W = 48;
const MAX_PILE_W = 130;

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
  const [shakeStyle, shake] = useShake();
  const guide = useGuide('matatu');

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
  // Both piles side by side with the status beside them, as big as the
  // measured middle allows: the draw pile's label sits under it (STAGE_LABEL).
  const pileW = Math.floor(
    Math.max(MIN_PILE_W, Math.min(MAX_PILE_W, (W - 32 - 2 * STAGE_GAP - INFO_MIN_W) / 2, stageH > 0 ? (stageH - STAGE_LABEL) * CARD_RATIO : 80)),
  );
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

  // A wrong card by the person holding the phone: shake the hand and buzz.
  useEffect(() => {
    if (notice?.kind === 'wrong' && notice.seat === viewer) {
      shake();
      feel.wrong();
    }
  }, [notice, viewer, shake]);

  const result = game.roundResult;
  const winner = matchWinner(game);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.base }]} edges={['top', 'bottom']}>
      <FitScroll>
      <View style={[styles.column, { width: W }]}>
        <GameTopBar
          onLeave={() => setLeaving(true)}
          leaveLabel={t('leaveGame')}
          center={
            <Pressable accessibilityRole="button" onPress={() => setZoom(art(game.cutCard))}>
              <InfoPill label={`${t('cut')} ${SUIT_SYMBOL[game.cutSuit]}`}>
                <Ionicons name="cut-outline" size={16} color={colors.ink} />
                {/* Names the card that cuts, not just its suit. */}
                <PillText>{t('cut')}:</PillText>
                <PillText color={SUIT_INK[game.cutSuit]}>7{SUIT_SYMBOL[game.cutSuit]}</PillText>
              </InfoPill>
            </Pressable>
          }
          right={<HelpButton onPress={guide.open} />}
        />

        <PlayerChips
          width={W - 32}
          compact
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

        {/* The two piles side by side, with what is happening beside them */}
        <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setStageH(e.nativeEvent.layout.height)}>
          <View style={styles.stageRow}>
            <View style={styles.pileCol}>
              {game.stock.length > 0 ? <CardImage source={pageImage(config.deckId, deck.cover.page)} width={pileW} /> : <View style={[styles.empty, { width: pileW, height: pileH }]} />}
              <Text style={[styles.pileLabel, { color: theme.onBase }]} numberOfLines={1}>
                {t('pile', { n: game.stock.length })}
              </Text>
            </View>
            <View style={styles.pileCol}>
              {top ? (
                // Each new top card lands on the pile, whoever played it.
                <PopIn key={top.id}>
                  <Pressable accessibilityRole="button" accessibilityLabel={label(top)} onPress={() => setZoom(art(top))}>
                    <CardArt {...art(top)} width={pileW} />
                  </Pressable>
                </PopIn>
              ) : (
                <View style={[styles.empty, { width: pileW, height: pileH }]} />
              )}
            </View>
            <View style={styles.info}>
              {/* A notice takes the status line's place for a moment. */}
              {noticeText ? (
                <Text style={styles.notice}>{noticeText}</Text>
              ) : (
                <Text style={[styles.status, { color: game.turn === viewer ? colors.lime : theme.onBase }]}>{status}</Text>
              )}
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

        {/* The hand of the person holding the phone; it shakes on a wrong card. */}
        <Animated.View style={[styles.handArea, shakeStyle]}>
          {owed && owed.seat === viewer ? <Button variant="lime" label={t(owed.word)} onPress={table.sayIt} style={styles.wide} /> : null}
          {viewer !== null ? (
            <Text style={[styles.handName, { color: theme.onBase }]}>
              {name(viewer)} · {t('cardsCount', { n: hand.length })}
            </Text>
          ) : null}
          <HandRow
            deckId={config.deckId}
            cards={hand.map((c) => ({ id: c.id, label: label(c) }))}
            width={W - 32}
            ink={theme.onBase}
            onPress={(id) => {
              const c = hand.find((x) => x.id === id)!;
              if (choosing && (game.phase === 'play' || game.phase === 'queen')) setPreview(c);
              else setZoom(art(c));
            }}
          />
          <View style={styles.actions}>
            <Button
              variant="secondary"
              label={game.pickup && game.phase === 'play' ? t('pickN', { n: game.pickup.total }) : t('pickCard')}
              onPress={() => {
                feel.tap();
                table.pick();
              }}
              disabled={!canPick}
              style={styles.wide}
            />
          </View>
        </Animated.View>
      </View>
      </FitScroll>

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
                if (preview) {
                  feel.play();
                  table.play(preview);
                }
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
            <Button
              variant="lime"
              label={t('playIt')}
              onPress={() => {
                if (!game.drawn) return;
                feel.play();
                table.play(game.drawn);
              }}
            />
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
      <HowToPlay game="matatu" deckId={config.deckId} visible={guide.visible} onClose={guide.close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  // Never shorter than its smallest piles, so on a very short screen the page scrolls instead of overlapping.
  stage: { flex: 1, minHeight: STAGE_LABEL + MIN_PILE_W / CARD_RATIO + 8, justifyContent: 'center', paddingVertical: 4 },
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: STAGE_GAP },
  info: { flex: 1, minWidth: INFO_MIN_W, maxWidth: 170, gap: 8, alignItems: 'flex-start' },
  notice: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, backgroundColor: colors.lime, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, overflow: 'hidden' },
  pileCol: { alignItems: 'center', gap: 6 },
  empty: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  pileLabel: { fontFamily: fonts.semibold, fontSize: 12, opacity: 0.85 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 10, height: 28 },
  infoChipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  infoChipSuit: { fontFamily: fonts.display, fontSize: 16 },
  status: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  handArea: { gap: 8, paddingBottom: 10 },
  handName: { fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center', opacity: 0.85 },
  actions: { flexDirection: 'row', gap: 10 },
  wide: { flex: 1 },
  suits: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  suitButton: { flex: 1, aspectRatio: 1, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  suitButtonText: { fontSize: 40, fontFamily: fonts.display },
});
