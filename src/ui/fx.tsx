/**
 * Touch and rewards, drawn with Reanimated so they stay smooth while the app
 * is busy: a springy press for everything tappable, a burst of colour and
 * rising points for a right answer, numbers that count up, bars that fill,
 * and medals that spin in. All of it jumps straight to the end when the
 * phone is set to reduce motion.
 *
 * Effects that float over other things carry testID "fx", so the overlap
 * check leaves them out.
 */

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, PressableProps, PressableStateCallbackType, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { feel, useReducedMotion } from './motion';
import { colors } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS = { damping: 22, stiffness: 520, mass: 0.6 };
const RELEASE = { damping: 9, stiffness: 280, mass: 0.6 };

export interface TapProps extends PressableProps {
  /** How far it sinks while held; 1 for none. */
  pressScale?: number;
  /** A light tick under the finger (only when it does something). */
  haptic?: boolean;
}

/** Pressable that sinks under the finger and springs back with a little bounce. */
export function Tap({ style, pressScale = 0.95, haptic = true, onPressIn, onPressOut, ...rest }: TapProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const own = typeof style === 'function' ? style({ pressed, hovered: false } as PressableStateCallbackType) : style;
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        if (!reduced && pressScale !== 1) scale.set(withSpring(pressScale, PRESS));
        if (haptic && rest.onPress && !rest.disabled) feel.tap();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        scale.set(reduced ? 1 : withSpring(1, RELEASE));
        onPressOut?.(e);
      }}
      style={[own, pressScale !== 1 ? animated : null]}
    />
  );
}

const BURST_COLORS = [colors.lime, colors.coral, colors.sky, colors.pink, colors.highlight, colors.mint];

function Bit({ angle, distance, size, color, round, delay, onDone }: { angle: number; distance: number; size: number; color: string; round: boolean; delay: number; onDone?: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }, (done) => {
          if (done && onDone) runOnJS(onDone)();
        }),
      ),
    );
  }, [t, delay, onDone]);
  const style = useAnimatedStyle(() => {
    const d = distance * t.get();
    return {
      opacity: t.get() < 0.6 ? 1 : 1 - (t.get() - 0.6) / 0.4,
      transform: [
        { translateX: Math.cos(angle) * d },
        // A little gravity: the bits drop as they fly.
        { translateY: Math.sin(angle) * d + 18 * t.get() * t.get() },
        { rotate: `${t.get() * 220}deg` },
        { scale: t.get() < 0.2 ? 0.4 + t.get() * 3 : 1 - (t.get() - 0.2) * 0.5 },
      ],
    };
  });
  return <Animated.View style={[styles.bit, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, backgroundColor: color, borderRadius: round ? size / 2 : 2 }, style]} />;
}

/**
 * A burst of coloured bits from the middle of its parent, each time `trigger`
 * changes to something truthy. `big` for a goal or a medal.
 */
export function Burst({ trigger, big = false }: { trigger: unknown; big?: boolean }) {
  const reduced = useReducedMotion();
  // The trigger whose burst has finished; a new trigger starts a new burst.
  const [finished, setFinished] = useState<unknown>(null);
  const finish = useCallback(() => setFinished(trigger), [trigger]);
  const shown = trigger && !reduced && finished !== trigger ? trigger : null;
  if (!shown) return null;
  const n = big ? 22 : 12;
  return (
    <View testID="fx" pointerEvents="none" style={styles.burst} key={String(shown)}>
      {Array.from({ length: n }, (_, i) => (
        <Bit
          key={i}
          angle={(i / n) * Math.PI * 2 + (i % 2) * 0.3}
          distance={(big ? 90 : 56) + ((i * 37) % 5) * (big ? 12 : 7)}
          size={(big ? 10 : 8) + (i % 3) * 2}
          color={BURST_COLORS[i % BURST_COLORS.length]}
          round={i % 3 === 0}
          delay={(i % 4) * 25}
          onDone={i === n - 1 ? finish : undefined}
        />
      ))}
    </View>
  );
}

/** "+15" rising and fading from where it sits, each time `trigger` changes to something truthy. */
export function FloatUp({ trigger, text, style }: { trigger: unknown; text: string; style?: StyleProp<TextStyle> }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(1);
  // The trigger whose rise has finished; a new trigger starts a new one.
  const [finished, setFinished] = useState<unknown>(null);
  const shown = !!trigger && !reduced && finished !== trigger;
  useEffect(() => {
    if (!trigger || reduced) return;
    const end = () => setFinished(trigger);
    t.set(0);
    t.set(
      withTiming(1, { duration: 950, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(end)();
      }),
    );
  }, [trigger, reduced, t]);
  const anim = useAnimatedStyle(() => ({
    opacity: t.get() < 0.15 ? t.get() / 0.15 : 1 - Math.max(0, t.get() - 0.55) / 0.45,
    transform: [{ translateY: -46 * t.get() }, { scale: 0.7 + Math.min(t.get() * 3, 1) * 0.5 }],
  }));
  if (!shown) return null;
  return (
    <Animated.View testID="fx" pointerEvents="none" style={[styles.float, anim]}>
      <Text style={[styles.floatText, style]}>{text}</Text>
    </Animated.View>
  );
}

/** A number that counts up to its value (from 0 the first time, then from the last value). */
export function CountUp({ value, style, duration = 700 }: { value: number; style?: StyleProp<TextStyle>; duration?: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const start = Date.now();
    const a = from.current;
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, duration]);
  return <Text style={style}>{reduced ? value : shown}</Text>;
}

/** The coloured part of a progress bar, filling to `share` (0–1) with a spring. */
export function FillBar({ share, style, delay = 0 }: { share: number; style?: StyleProp<ViewStyle>; delay?: number }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? share : 0);
  useEffect(() => {
    w.set(reduced ? share : withDelay(delay, withSpring(share, { damping: 18, stiffness: 90 })));
  }, [share, reduced, delay, w]);
  const anim = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, w.get())) * 100}%` }));
  return <Animated.View style={[style, anim]} />;
}

/** Spins and grows into place once: a medal just won. */
export function SpinIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) t.set(withDelay(delay, withSpring(1, { damping: 8, stiffness: 70 })));
  }, [t, delay, reduced]);
  const anim = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.get() * 2),
    transform: [{ perspective: 400 }, { rotateY: `${(1 - t.get()) * 540}deg` }, { scale: 0.3 + 0.7 * t.get() }],
  }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

/** A soft, endless pulse: the streak's flame. */
export function Pulse({ children, on = true }: { children: ReactNode; on?: boolean }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (!on || reduced) return;
    s.set(withRepeat(withSequence(withTiming(1.18, { duration: 520 }), withTiming(1, { duration: 620 })), -1));
  }, [on, reduced, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bit: { position: 'absolute', left: '50%', top: '50%' },
  float: { position: 'absolute', alignSelf: 'center', top: -8, zIndex: 10 },
  floatText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 26, color: colors.lime, letterSpacing: -0.5 },
});
