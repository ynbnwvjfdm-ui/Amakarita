import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CARD_RATIO, getDeck } from '../decks';
import { Profile } from '../game/profiles';
import { useI18n } from '../i18n';
import { questionFor } from '../questions';
import { DeckStat } from '../stats';
import { ArtRef, CardArt } from './CardArt';
import { MEDAL_COLOR } from './Medal';
import { Avatar } from './Profiles';
import { QuestionCard } from './QuestionCard';
import { colors, fonts } from './theme';

export interface ShareStats {
  profile: Pick<Profile, 'name' | 'color'>;
  points: number;
  streak: number;
  decks: DeckStat[];
}

interface Props {
  stats: ShareStats;
  width: number;
  /** A card to show off at the top, when sharing from a card. */
  featured?: ArtRef;
}

/** 1284 → "1,284". */
export function groupThousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const CARD_BG = '#15131C';
/** Round the card in the picture, so its rounded corners show against something dark, never white. */
const PLATE = '#0A0814';
const PLATE_PAD = 14;

/** The size of the shared picture for a card `width` wide (the card plus its dark plate). */
export function shareSize(width: number): { width: number; height: number } {
  const pad = platePad(width) * 2;
  return { width: width + pad, height: Math.round(width / CARD_RATIO) + pad };
}

/** Whole pixels, so the picture's edges never pick up a sliver of white. */
const platePad = (width: number) => Math.round(PLATE_PAD * (width / 300));
const FAINT = 'rgba(255,255,255,0.16)';

/** Big faded suits behind everything, partly off the card, like a printed back. */
const BIG_SUITS = [
  { glyph: '♠', x: -38, y: 38, size: 170, rotate: '-14deg' },
  { glyph: '♦', x: 196, y: 250, size: 180, rotate: '12deg' },
];
/** Small bright suits scattered round the edge. */
const CONFETTI = [
  { glyph: '♥', x: 228, y: 62, size: 15, color: colors.coral, rotate: '18deg' },
  { glyph: '♣', x: 262, y: 118, size: 11, color: colors.sky, rotate: '-10deg' },
  { glyph: '♦', x: 30, y: 128, size: 12, color: colors.lime, rotate: '8deg' },
  { glyph: '♠', x: 22, y: 236, size: 14, color: '#B9AEFF', rotate: '-20deg' },
  { glyph: '♥', x: 264, y: 214, size: 10, color: colors.pink, rotate: '-6deg' },
  { glyph: '♣', x: 36, y: 318, size: 11, color: colors.coral, rotate: '14deg' },
  { glyph: '♦', x: 210, y: 330, size: 9, color: colors.sky, rotate: '0deg' },
];

/**
 * A learner's progress drawn as a playing card, to share as a picture: the
 * streak sits in the corners where a card has its number and suit, the
 * points in the middle, and a medal for each deck.
 */
export const ShareCard = forwardRef<View, Props>(function ShareCard({ stats, width, featured }, ref) {
  const { t } = useI18n();
  const s = width / 300;
  const height = Math.round(width / CARD_RATIO);
  const known = stats.decks.reduce((n, d) => n + d.known, 0);
  const total = stats.decks.reduce((n, d) => n + d.total, 0);
  const small = !!featured;
  // A card with words is shown in the app's own lettering with the answer filled in:
  // the printed words would be far too small to read at this size.
  const featuredCard = featured
    ? getDeck(featured.deckId).cards.find((c) => (featured.cardId ? c.id === featured.cardId : c.page === featured.page))
    : undefined;
  const featuredQuestion = featuredCard ? questionFor(featuredCard.id) : undefined;

  const num = (turned: boolean) => (
    <Text style={[styles.cornerNum, { fontSize: 34 * s, lineHeight: 36 * s, letterSpacing: -1.5 * s }, turned && styles.turned]}>{stats.streak}</Text>
  );
  const flame = <Ionicons name="flame" size={24 * s} color={colors.coral} style={{ marginVertical: 4 * s }} />;

  return (
    <View ref={ref} collapsable={false} style={[styles.plate, { padding: platePad(width) }]}>
      <View style={[styles.card, { width, height, borderRadius: 16 * s }]}>
        {BIG_SUITS.map((g, i) => (
          <Text
            key={`b${i}`}
            style={[styles.bigSuit, { left: g.x * s, top: g.y * s, fontSize: g.size * s, lineHeight: g.size * 1.1 * s, transform: [{ rotate: g.rotate }] }]}
          >
            {g.glyph}
          </Text>
        ))}
        {CONFETTI.map((c, i) => (
          <Text key={`c${i}`} style={[styles.confetti, { left: c.x * s, top: c.y * s, fontSize: c.size * s, color: c.color, transform: [{ rotate: c.rotate }] }]}>
            {c.glyph}
          </Text>
        ))}
        <View style={[styles.frame, { top: 7 * s, left: 7 * s, right: 7 * s, bottom: 7 * s, borderRadius: 10 * s, borderWidth: Math.max(1, 1.2 * s) }]} />

        <View style={[styles.corner, { top: 15 * s, left: 16 * s }]}>
          {num(false)}
          {flame}
        </View>
        {/* Like a card's bottom corner, except the flame stays upright: upside down it looks like a map pin. */}
        <View style={[styles.corner, { bottom: 15 * s, right: 16 * s }]}>
          {flame}
          {num(true)}
        </View>
        <View style={[styles.pill, { top: 16 * s, right: 16 * s, paddingHorizontal: 9 * s, paddingVertical: 4 * s, borderRadius: 20 * s }]}>
          <Text style={[styles.pillText, { fontSize: 9 * s, letterSpacing: 0.8 * s }]}>AMAKARITA</Text>
        </View>
        <Text style={[styles.label, { bottom: 20 * s, left: 18 * s, fontSize: 6.5 * s, letterSpacing: 1.1 * s, maxWidth: 200 * s }]} numberOfLines={1}>
          {t('shareTagline').toUpperCase()}
        </Text>

        {/* The middle, kept clear of the corners. */}
        <View style={[styles.middle, { top: 52 * s, bottom: 52 * s, left: 30 * s, right: 30 * s }]}>
          <View style={[styles.glow, { width: 230 * s, height: 230 * s, borderRadius: 115 * s }]} />
          {featured ? (
            <View style={{ marginBottom: 8 * s }}>
              {featuredQuestion && featuredQuestion.kind !== 'read' ? (
                <QuestionCard question={featuredQuestion} width={110 * s} view="read" revealed />
              ) : (
                <CardArt {...featured} width={110 * s} />
              )}
            </View>
          ) : stats.profile.name ? (
            <View style={[styles.who, { gap: 8 * s, marginBottom: 6 * s }]}>
              <Avatar profile={stats.profile} size={28 * s} />
              <Text style={[styles.name, { fontSize: 17 * s }]} numberOfLines={1}>
                {stats.profile.name}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.points, { fontSize: (small ? 42 : 62) * s, lineHeight: (small ? 46 : 66) * s, letterSpacing: -2 * s }]} numberOfLines={1} adjustsFontSizeToFit>
            {groupThousands(stats.points)}
          </Text>
          <Text style={[styles.pointsLabel, { fontSize: 11 * s, letterSpacing: 2.4 * s, marginBottom: (small ? 8 : 12) * s }]}>{t('points').toUpperCase()}</Text>

          {small ? null : (
            <View style={[styles.streak, { gap: 6 * s, paddingHorizontal: 12 * s, paddingVertical: 5 * s, borderRadius: 20 * s, marginBottom: 14 * s }]}>
              <Ionicons name="flame" size={14 * s} color={colors.coral} />
              <Text style={[styles.streakText, { fontSize: 12 * s }]}>{t('streakDays', { n: stats.streak })}</Text>
            </View>
          )}

          <View style={[styles.medals, { width: 236 * s, marginBottom: (small ? 10 : 14) * s }]}>
            {stats.decks.map(({ deck, medal }) => {
              const d = (small ? 28 : 36) * s;
              return (
                <View key={deck.id} style={[styles.medalCol, { width: 47 * s, gap: 4 * s }]}>
                  {/* A medal is a coin in its metal with the deck's letter; not yet won, a faint outline. */}
                  <View
                    style={[
                      styles.disc,
                      { width: d, height: d, borderRadius: d / 2, borderWidth: Math.max(1, 1.5 * s) },
                      medal ? { backgroundColor: MEDAL_COLOR[medal], borderColor: 'rgba(255,255,255,0.6)' } : styles.discEmpty,
                    ]}
                  >
                    {medal ? <View style={[styles.ring, { width: d * 0.74, height: d * 0.74, borderRadius: d * 0.37, borderWidth: Math.max(1, 1.2 * s) }]} /> : null}
                    <Text style={[medal ? styles.coinLetter : styles.discLetter, { fontSize: d * 0.42 }]}>{deck.title.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.medalName, { fontSize: 6 * s }]} numberOfLines={1}>
                    {deck.title.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.known, { fontSize: 11 * s, marginBottom: 5 * s }]}>{t('knownOf', { n: known, total })}</Text>
          <View style={[styles.track, { width: 170 * s, height: 6 * s, borderRadius: 3 * s }]}>
            <View style={[styles.fill, { width: `${total ? (known / total) * 100 : 0}%`, borderRadius: 3 * s }]} />
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  plate: { backgroundColor: PLATE, alignSelf: 'center' },
  card: { backgroundColor: CARD_BG, overflow: 'hidden' },
  bigSuit: { position: 'absolute', color: 'rgba(255,255,255,0.06)', fontFamily: fonts.display },
  confetti: { position: 'absolute', fontFamily: fonts.display },
  frame: { position: 'absolute', borderColor: FAINT },
  corner: { position: 'absolute', alignItems: 'center' },
  turned: { transform: [{ rotate: '180deg' }] },
  cornerNum: { fontFamily: fonts.display, color: colors.lime },
  pill: { position: 'absolute', backgroundColor: colors.lime },
  pillText: { fontFamily: fonts.display, color: CARD_BG },
  label: { position: 'absolute', fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.55)' },
  middle: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(215,255,63,0.045)' },
  who: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
  name: { flexShrink: 1, fontFamily: fonts.display, color: '#FFFFFF' },
  points: { fontFamily: fonts.display, color: colors.lime, maxWidth: '100%' },
  pointsLabel: { fontFamily: fonts.bold, color: 'rgba(255,255,255,0.75)' },
  streak: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  streakText: { fontFamily: fonts.bold, color: '#FFFFFF' },
  medals: { flexDirection: 'row', justifyContent: 'space-between' },
  medalCol: { alignItems: 'center' },
  disc: { alignItems: 'center', justifyContent: 'center' },
  discEmpty: { borderColor: FAINT, backgroundColor: 'rgba(255,255,255,0.03)' },
  discLetter: { fontFamily: fonts.display, color: 'rgba(255,255,255,0.3)' },
  ring: { position: 'absolute', borderColor: 'rgba(21,19,28,0.22)' },
  coinLetter: { fontFamily: fonts.display, color: CARD_BG },
  medalName: { fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.6)' },
  known: { fontFamily: fonts.bold, color: '#FFFFFF' },
  track: { backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.lime },
});
