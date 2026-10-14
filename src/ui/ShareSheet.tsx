import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dayNumber } from '../dates';
import { CARD_RATIO } from '../decks';
import { streak } from '../game/progress';
import { useI18n } from '../i18n';
import { useProgress } from '../progressStore';
import { deckStats, pointsOf } from '../stats';
import { Button } from './Button';
import { ArtRef } from './CardArt';
import { feel, PopIn } from './motion';
import { Overlay } from './Overlay';
import { shareText } from './share';
import { ShareCard, shareSize } from './ShareCard';
import { shareImage } from './shareImage';
import { colors, radius } from './theme';

interface Props {
  visible: boolean;
  /** A card to show off on the picture, when sharing from a card. */
  featured?: ArtRef;
  onClose: () => void;
}

/** The active person's progress card, large, with a button to share it as a picture. */
export function ShareSheet({ visible, featured, onClose }: Props) {
  return (
    <Overlay visible={visible} onRequestClose={onClose}>
      {visible ? <Sheet featured={featured} onClose={onClose} /> : null}
    </Overlay>
  );
}

function Sheet({ featured, onClose }: { featured?: ArtRef; onClose: () => void }) {
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const { active, progress } = useProgress();
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const decks = deckStats(progress);
  const stats = { profile: active, points: pointsOf(progress), streak: streak(progress, dayNumber(new Date())), decks };
  // The card plus its dark plate (about a tenth wider) fits with the button under it.
  const cardW = Math.floor(Math.min((width - 40) / 1.1, 340, ((height - 230) * CARD_RATIO) / 1.07));
  const known = decks.reduce((n, d) => n + d.known, 0);
  const total = decks.reduce((n, d) => n + d.total, 0);
  const text = t('shareProgress', { n: known, total });

  const share = async () => {
    if (busy) return;
    setBusy(true);
    feel.tap();
    try {
      await shareImage(card, shareSize(cardW), text);
    } catch {
      // No picture (an old browser, or sharing unavailable): share the words instead.
      await shareText(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.dim}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" />
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="close" onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.middle} pointerEvents="box-none">
        <PopIn from="grow">
          <ShareCard ref={card} stats={stats} width={cardW} featured={featured} />
        </PopIn>
        <Button variant="lime" label={t('shareShort')} onPress={share} disabled={busy} style={{ width: cardW }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The same dark as the picture's plate, so on screen the card seems to float on it.
  dim: { flex: 1, backgroundColor: '#0A0814' },
  top: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  close: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 24 },
});
