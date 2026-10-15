import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Tap } from './fx';
import { CARD_RATIO } from '../decks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArtRef, CardArt } from './CardArt';
import { Overlay } from './Overlay';
import { colors, MAX_WIDTH, fonts, radius } from './theme';

interface Props {
  /** The card to show, or null when closed. */
  art: ArtRef | null;
  caption?: string;
  onClose: () => void;
  /** Buttons shown under the card. Tapping outside the card closes. */
  actions?: ReactNode;
}

/** A card shown large over a dimmed background, so its words can be read. */
export function CardViewer({ art, caption, onClose, actions }: Props) {
  const { width, height } = useWindowDimensions();
  const room = Math.min(width, MAX_WIDTH) * 0.8;
  const cardWidth = Math.min(room, (height - (actions ? 260 : 180)) * CARD_RATIO);
  const card = art ? <CardArt {...art} width={cardWidth} /> : null;
  return (
    <Overlay visible={art !== null} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Tap pressScale={1} haptic={false} style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" />
        <View style={styles.top}>
          <Tap accessibilityRole="button" accessibilityLabel="close" onPress={onClose} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Tap>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} style={styles.column} showsVerticalScrollIndicator={false}>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          <Tap onPress={actions ? undefined : onClose}>{card}</Tap>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </ScrollView>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  // Nearly opaque, so nothing on the screen behind shows through under the buttons.
  backdrop: { flex: 1, backgroundColor: 'rgba(10,8,20,0.94)', alignItems: 'center' },
  top: { width: '100%', maxWidth: MAX_WIDTH, alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  close: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  column: { width: '100%', maxWidth: MAX_WIDTH },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 28, paddingHorizontal: 16, gap: 16 },
  caption: { color: '#fff', fontSize: 18, fontFamily: fonts.bold, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
});
