import { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Suit } from '../game/cards';
import { useI18n } from '../i18n';
import { Button } from './Button';
import { CardImage } from './CardImage';
import { colors, radius, fonts } from './theme';

// Text presentation selector (U+FE0E) keeps phones from drawing emoji hearts.
export const SUIT_SYMBOL: Record<Suit, string> = { spades: '♠︎', hearts: '♥︎', clubs: '♣︎', diamonds: '♦︎' };
/** Suit colours readable on the green table. */
export const SUIT_COLOR: Record<Suit, string> = { spades: '#FFFFFF', hearts: '#FF6B6B', clubs: '#FFFFFF', diamonds: '#FF6B6B' };

/** A centred panel over a dimmed table. */
export function Panel({ visible, title, children, onRequestClose }: { visible: boolean; title: string; children: ReactNode; onRequestClose?: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.dim}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Covers the table while the phone goes to the next person, so nobody sees another's cards. */
export function PassPhone({
  name,
  cover,
  onAccept,
  onRequestClose,
  children,
}: {
  name: string | null;
  cover: number;
  onAccept: () => void;
  onRequestClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Modal visible={name !== null} animationType="fade" onRequestClose={onRequestClose}>
      <SafeAreaView style={styles.handoff}>
        <CardImage source={cover} width={120} />
        <Text style={styles.handoffTitle}>{name !== null ? t('passPhoneTo', { name }) : ''}</Text>
        <Text style={styles.handoffNote}>{t('dontLook')}</Text>
        <Button label={name !== null ? t('showMyCards', { name }) : ''} onPress={onAccept} />
        {children}
      </SafeAreaView>
    </Modal>
  );
}

export function LeaveConfirm({ visible, onLeave, onStay }: { visible: boolean; onLeave: () => void; onStay: () => void }) {
  const { t } = useI18n();
  return (
    <Panel visible={visible} title={t('leaveConfirm')} onRequestClose={onStay}>
      <Button label={t('yes')} onPress={onLeave} />
      <Button label={t('no')} variant="secondary" onPress={onStay} />
    </Panel>
  );
}

export const tableStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.table },
  column: { flex: 1, alignSelf: 'center', paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  close: { fontSize: 22, color: colors.tableInk, paddingHorizontal: 4 },
  label: { fontSize: 12, fontFamily: fonts.bold, color: colors.tableMuted, textTransform: 'uppercase' },
  suit: { fontSize: 24, fontFamily: fonts.display },
  others: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 },
  badge: { padding: 6, borderRadius: radius.button, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'transparent', gap: 6 },
  badgeActive: { borderColor: colors.highlight },
  badgeHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeName: { flex: 1, fontSize: 12, fontFamily: fonts.bold, color: colors.tableInk },
  status: { fontSize: 16, fontFamily: fonts.semibold, color: colors.tableInk, textAlign: 'center' },
  statusMine: { color: colors.highlight },
  handName: { fontSize: 14, fontFamily: fonts.bold, color: colors.tableMuted, textAlign: 'center' },
  headline: { fontSize: 18, fontFamily: fonts.bold, color: colors.accent, textAlign: 'center' },
  body: { fontSize: 15, color: colors.ink, textAlign: 'center', lineHeight: 21 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  scoreName: { flex: 1, fontSize: 15, color: colors.ink },
  scorePoints: { fontSize: 20, fontFamily: fonts.display, color: colors.ink },
  scoreUnit: { fontSize: 12, fontFamily: fonts.semibold, color: colors.muted },
  scoreHighlight: { color: colors.accent },
});

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { width: '100%', maxWidth: 400, backgroundColor: colors.bg, borderRadius: radius.panel, padding: 20, gap: 12 },
  panelTitle: { fontSize: 22, fontFamily: fonts.display, color: colors.ink, textAlign: 'center' },
  handoff: { flex: 1, backgroundColor: colors.table, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  handoffTitle: { fontSize: 26, fontFamily: fonts.display, color: colors.tableInk, textAlign: 'center' },
  handoffNote: { fontSize: 16, color: colors.tableMuted, textAlign: 'center' },
});
