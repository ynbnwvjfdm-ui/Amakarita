import { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  width: number;
  height: number;
  style?: ViewStyle;
}

/** Turns over like a real card between its two faces. */
export function FlipCard({ flipped, front, back, width, height, style }: Props) {
  const [turn] = useState(() => new Animated.Value(flipped ? 1 : 0));

  useEffect(() => {
    Animated.timing(turn, {
      toValue: flipped ? 1 : 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flipped, turn]);

  const frontTurn = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backTurn = turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const lift = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });

  return (
    <View style={[{ width, height }, style]}>
      <Animated.View
        pointerEvents={flipped ? 'none' : 'auto'}
        style={[styles.face, { transform: [{ perspective: 1200 }, { rotateY: frontTurn }, { scale: lift }] }]}
      >
        {front}
      </Animated.View>
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.face, { transform: [{ perspective: 1200 }, { rotateY: backTurn }, { scale: lift }] }]}
      >
        {back}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { ...StyleSheet.absoluteFill, backfaceVisibility: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
