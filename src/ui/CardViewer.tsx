import { ReactNode } from 'react';
import { ImageSourcePropType, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CARD_RATIO } from '../decks';
import { CardImage } from './CardImage';
import { MAX_WIDTH } from './theme';

interface Props {
  source: ImageSourcePropType | null;
  caption?: string;
  onClose: () => void;
  /** Buttons shown under the card. Tapping outside the card closes. */
  actions?: ReactNode;
}

/** A card shown large over a dimmed background, so its words can be read. */
export function CardViewer({ source, caption, onClose, actions }: Props) {
  const { width, height } = useWindowDimensions();
  const room = Math.min(width, MAX_WIDTH) * 0.78;
  const cardWidth = Math.min(room, (height - (actions ? 220 : 140)) * CARD_RATIO);
  return (
    <Modal visible={source !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="close">
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        {source ? <CardImage source={source} width={cardWidth} /> : null}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 },
  caption: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
});
