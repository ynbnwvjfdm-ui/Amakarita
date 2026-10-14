import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { CARD_RATIO } from '../decks';
import { useI18n } from '../i18n';
import { CardArt } from './CardArt';
import { useReducedMotion } from './motion';
import { deckTheme, fonts } from './theme';

/**
 * Where the flap starts, as a share of the card's height. Measured over all
 * 54 riddle cards: the logo ends at 0.524 and the answers sit between 0.752
 * and 0.826, so the flap hides every answer and never the logo or riddle.
 */
const FLAP_TOP = 0.6;
const theme = deckTheme('ibisakuzo');
/** Deeper than the deck's red, so the flap stands apart from the red table behind the card. */
const FLAP_RED = '#6E1219';

interface Props {
  page: number;
  width: number;
  /** The answer at the bottom is hidden under a flap until uncovered. */
  covered: boolean;
  /** Tapping the flap uncovers the answer; without it the flap can't be tapped. */
  onUncover?: () => void;
}

/** A printed riddle card whose answer is hidden under a flap that slides away. */
export function RiddleCard({ page, width, covered, onUncover }: Props) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const height = width / CARD_RATIO;
  const s = width / 300;
  // 1 = covering the answer, 0 = slid down out of the card.
  const [shut] = useState(() => new Animated.Value(covered ? 1 : 0));
  useEffect(() => {
    const anim = Animated.timing(shut, { toValue: covered ? 1 : 0, duration: reduced ? 0 : 380, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [covered, reduced, shut]);
  const flapH = height * (1 - FLAP_TOP);

  return (
    <CardArt deckId="ibisakuzo" page={page} width={width}>
      <Animated.View
        pointerEvents={covered ? 'auto' : 'none'}
        style={[styles.flap, { top: height * FLAP_TOP, transform: [{ translateY: shut.interpolate({ inputRange: [0, 1], outputRange: [flapH, 0] }) }] }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('showAnswer')}
          disabled={!onUncover}
          onPress={onUncover}
          style={[styles.flapInner, { borderTopWidth: Math.max(1.5, 2 * s) }]}
        >
          <Text style={[styles.mark, { fontSize: 54 * s, lineHeight: 60 * s }]}>?</Text>
          <Text style={[styles.label, { fontSize: 11 * s, letterSpacing: 2.4 * s }]}>{t('answerIs').toUpperCase()}</Text>
        </Pressable>
      </Animated.View>
    </CardArt>
  );
}

const styles = StyleSheet.create({
  flap: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: FLAP_RED },
  // A light top edge, so the flap reads as a separate piece laid over the card.
  flapInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(237,248,239,0.45)' },
  mark: { fontFamily: fonts.display, color: theme.onBase },
  label: { fontFamily: fonts.bold, color: theme.onBase, opacity: 0.85 },
});
