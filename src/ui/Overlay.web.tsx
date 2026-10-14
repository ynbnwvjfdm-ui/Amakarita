import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OverlayProps } from './Overlay';

/**
 * A layer over the whole screen, in the browser. It is drawn at the top of the
 * page (a portal into <body>), so it covers everything wherever it is used —
 * even when the component asking for it sits inside a small box — and it keeps
 * clear of any bar the page is shown under, like a phone's modal does.
 */
export function Overlay({ visible, children }: OverlayProps) {
  if (!visible || typeof document === 'undefined') return null;
  return createPortal(<FadeIn>{children}</FadeIn>, document.body);
}

function FadeIn({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  }, [opacity]);
  return (
    <Animated.View testID="overlay" style={[styles.layer, { opacity, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // "fixed" pins the layer to the browser window, whatever box it was asked for in.
  layer: { position: 'fixed' as ViewStyle['position'], top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
});
