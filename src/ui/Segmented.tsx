import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from './theme';

interface Props<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Spoken label for each option. */
  label: (v: T) => string;
}

/** A row of mutually exclusive choices. */
export function Segmented<T extends string | number>({ options, value, onChange, label }: Props<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentLabel, on && styles.segmentLabelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, padding: 3 },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 8 },
  segmentOn: { backgroundColor: colors.ink },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  segmentLabelOn: { color: colors.surface },
});
