import * as Haptics from 'expo-haptics';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, ViewStyle } from 'react-native';

/**
 * Gentle buzzes for moves. They never fail loudly: on a phone or browser
 * without a vibration motor nothing happens.
 */
export const feel = {
  /** Picking up or choosing something. */
  tap: () => Haptics.selectionAsync().catch(() => {}),
  /** A card put down. */
  play: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  right: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  wrong: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

/** True when the person has asked their phone for less motion; animations then jump to the end. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => {
        if (alive) setReduced(r);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

interface PopInProps {
  children: ReactNode;
  /** Where the card comes from: up from below (dealt or played) or just growing in place. */
  from?: 'below' | 'grow';
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Brings its content in once, when it first appears: a card being dealt or played. */
export function PopIn({ children, from = 'below', delay = 0, style }: PopInProps) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.spring(t, { toValue: 1, delay, damping: 14, stiffness: 160, mass: 0.8, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [t, delay]);
  const shown = reduced ? 1 : t;
  const transform =
    from === 'below'
      ? [{ translateY: Animated.multiply(Animated.subtract(1, shown), 36) }, { scale: Animated.add(0.88, Animated.multiply(shown, 0.12)) }]
      : [{ scale: Animated.add(0.7, Animated.multiply(shown, 0.3)) }];
  return <Animated.View style={[style, { opacity: shown, transform }]}>{children}</Animated.View>;
}

/** A sideways shake, for a wrong move. Returns the style to put on the shaken view and the trigger. */
export function useShake(): [{ transform: { translateX: Animated.Value }[] }, () => void] {
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(0));
  const shake = useCallback(() => {
    if (reduced) return;
    x.setValue(0);
    const step = (to: number) => Animated.timing(x, { toValue: to, duration: 55, easing: Easing.linear, useNativeDriver: true });
    Animated.sequence([step(-12), step(12), step(-9), step(9), step(-4), step(0)]).start();
  }, [reduced, x]);
  return [{ transform: [{ translateX: x }] }, shake];
}

/** A short bump in size whenever `value` changes after it first appears: a score going up. */
export function Bump({ value, children, style }: { value: unknown; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [s] = useState(() => new Animated.Value(1));
  const [initial] = useState(value);
  useEffect(() => {
    if (reduced || value === initial) return;
    Animated.sequence([
      Animated.timing(s, { toValue: 1.18, duration: 110, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, damping: 10, stiffness: 220, useNativeDriver: true }),
    ]).start();
  }, [value, initial, reduced, s]);
  return <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>;
}
