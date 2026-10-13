import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lang, useI18n } from '../i18n';
import { colors, fonts } from './theme';

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'rw', label: 'RW' },
  { lang: 'en', label: 'EN' },
];

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const on = o.lang === lang;
        return (
          <Pressable
            key={o.lang}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => setLang(o.lang)}
            style={[styles.option, on && styles.on]}
          >
            <Text style={[styles.label, on && styles.onLabel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 2 },
  option: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  on: { backgroundColor: colors.ink },
  label: { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },
  onLabel: { color: colors.surface },
});
