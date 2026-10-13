import { ReactNode, useEffect, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onRequestClose?: () => void;
  children: ReactNode;
}

/**
 * A layer over the current screen. On phones it is a native modal; in the
 * browser it is drawn inside the app, so it stays below any bar the page is
 * shown under instead of sliding beneath it.
 */
export function Overlay({ visible, onRequestClose, children }: Props) {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent>
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>{children}</View>
      </Modal>
    );
  }
  return visible ? <FadeIn>{children}</FadeIn> : null;
}

function FadeIn({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  }, [opacity]);
  return (
    <Animated.View testID="overlay" style={[StyleSheet.absoluteFill, styles.layer, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 100 },
});
