import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useNav } from '../navigation';
import { colors, fonts, radius } from './theme';

interface Ticket {
  key: string;
  title: string;
  tagline: string;
  big: string;
  bigLabel: string;
  color: string;
  onPress?: () => void;
}

/** The games as a strip of coloured tickets joined by punched holes. */
export function GameTickets() {
  const { t } = useI18n();
  const nav = useNav();
  const tickets: Ticket[] = [
    { key: 'quiz', title: 'Amakarita', tagline: t('quizTagline'), big: '270', bigLabel: t('questionsCount'), color: colors.lime, onPress: () => nav.push({ name: 'quizSetup' }) },
    { key: 'matatu', title: 'Matatu', tagline: t('matatuTicket'), big: '2–6', bigLabel: t('playersWord'), color: colors.sky, onPress: () => nav.push({ name: 'matatuSetup' }) },
    { key: 'amaturufu', title: 'Amaturufu', tagline: t('amaturufuTagline'), big: '120', bigLabel: t('points').toLowerCase(), color: colors.pink },
    { key: 'ibisakuzo', title: 'Ibisakuzo', tagline: t('ibisakuzoTagline'), big: '54', bigLabel: t('questionsCount'), color: colors.mint },
  ];

  return (
    <View>
      {tickets.map((tk, i) => (
        <Fragment key={tk.key}>
          {i > 0 ? (
            <View style={styles.seam}>
              <View style={styles.hole} />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tk.title}
            disabled={!tk.onPress}
            onPress={tk.onPress}
            style={({ pressed }) => [styles.ticket, { backgroundColor: tk.color }, !tk.onPress && styles.soon, pressed && styles.pressed]}
          >
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{tk.title}</Text>
                <Text style={styles.tagline}>{tk.tagline}</Text>
              </View>
              <View style={styles.bigBox}>
                <Text style={styles.big}>{tk.big}</Text>
                <Text style={styles.bigLabel}>{tk.bigLabel}</Text>
              </View>
            </View>
            <View style={styles.row}>
              {tk.onPress ? (
                <View style={styles.play}>
                  <Text style={styles.playText}>{t('play')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.ink} />
                </View>
              ) : (
                <View style={styles.soonPill}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.soonText}>{t('comingSoon')}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: { borderRadius: 26, padding: 18, gap: 14 },
  soon: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.985 }] },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.4 },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, opacity: 0.75 },
  bigBox: { alignItems: 'flex-end' },
  big: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.ink, letterSpacing: -1 },
  bigLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink, opacity: 0.7 },
  play: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  playText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  soonPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  soonText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  seam: { height: 4, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  hole: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.ink },
});
