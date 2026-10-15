import { ReactNode } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface OverlayProps {
  visible: boolean;
  onRequestClose?: () => void;
  children: ReactNode;
}

/** A layer over the whole screen. On phones it is a native modal; the browser version is Overlay.web.tsx. */
export function Overlay({ visible, onRequestClose, children }: OverlayProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>{children}</View>
    </Modal>
  );
}
