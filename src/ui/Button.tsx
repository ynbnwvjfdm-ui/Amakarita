import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

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
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: colors.accentInk },
  otherLabel: { color: colors.ink },
});
