import { ReactNode } from 'react';
import { ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CARD_RATIO } from '../decks';
import { CardImage } from './CardImage';
import { MAX_WIDTH, fonts } from './theme';

interface Props {
  source: ImageSourcePropType | null;
  caption?: string;
  onClose: () => void;
  /** Buttons shown under the card. Tapping outside the card closes. */
  actions?: ReactNode;
  /** Extra content under the card (scrolls with it). */
  footer?: ReactNode;
}

/** A card shown large over a dimmed background, so its words can be read. */
export function CardViewer({ source, caption, onClose, actions, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const room = Math.min(width, MAX_WIDTH) * (footer ? 0.62 : 0.78);
  const cardWidth = Math.min(room, (height - (actions ? 220 : 140)) * CARD_RATIO);
  const body = (
    <>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {source ? <CardImage source={source} width={cardWidth} /> : null}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </>
  );
  return (
    <Modal visible={source !== null} transparent animationType="fade" onRequestClose={onClose}>
      {footer ? (
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" />
          <ScrollView contentContainerStyle={styles.scroll} style={{ width: '100%', maxWidth: MAX_WIDTH }}>
            <Pressable onPress={onClose} style={{ alignItems: 'center', gap: 16 }}>
              {body}
            </Pressable>
            {footer}
          </ScrollView>
        </View>
      ) : (
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="close">
          {body}
        </Pressable>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,8,20,0.82)', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 },
  scroll: { paddingVertical: 32, gap: 16 },
  caption: { color: '#fff', fontSize: 18, fontFamily: fonts.bold, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
});
