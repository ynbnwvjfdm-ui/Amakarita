import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'lime';
  disabled?: boolean;
  style?: ViewStyle;
}

/** Pill-shaped button. */
export function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.otherLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.ink },
  lime: { backgroundColor: colors.lime },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  label: { fontFamily: fonts.bold, fontSize: 16 },
  primaryLabel: { color: colors.surface },
  otherLabel: { color: colors.ink },
});
