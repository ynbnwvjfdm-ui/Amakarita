import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Medal } from '../game/progress';

export const MEDAL_COLOR: Record<Medal, string> = { bronze: '#B87333', silver: '#9EA3AB', gold: '#D4A017' };
export const MEDAL_KEY = { bronze: 'medalBronze', silver: 'medalSilver', gold: 'medalGold' } as const;

/** A medal in its metal's colour; an empty space of the same size when there is none yet, so rows line up. */
export function MedalIcon({ medal, size = 18 }: { medal: Medal | null; size?: number }) {
  if (!medal) return <View style={{ width: size, height: size }} />;
  return <Ionicons name="medal" size={size} color={MEDAL_COLOR[medal]} />;
}
