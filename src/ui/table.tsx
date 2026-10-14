import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Overlay } from './Overlay';
import { getDeck } from '../decks';
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
    <Overlay visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.dim}>
        <View style={styles.panel}>
          {/* Scrolls when the content is taller than the screen. */}
          <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.panelTitle}>{title}</Text>
            {children}
          </ScrollView>
        </View>
      </View>
    </Overlay>
  );
}

/** Covers the table while the phone goes to the next person, so nobody sees another's cards. */
export function PassPhone({
  name,
  deckId,
  onAccept,
  onRequestClose,
  children,
}: {
  name: string | null;
  /** The deck whose cover is shown. */
  deckId: string;
  onAccept: () => void;
  onRequestClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Overlay visible={name !== null} onRequestClose={onRequestClose}>
      <ScrollView style={styles.handoffScroll} contentContainerStyle={styles.handoff} bounces={false}>
        <CardImage deckId={deckId} page={getDeck(deckId).cover.page} width={120} />
        <Text style={styles.handoffTitle}>{name !== null ? t('passPhoneTo', { name }) : ''}</Text>
        <Text style={styles.handoffNote}>{t('dontLook')}</Text>
        <Button variant="lime" label={name !== null ? t('showMyCards', { name }) : ''} onPress={onAccept} />
        {children}
      </ScrollView>
    </Overlay>
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
  close: { fontFamily: fonts.body, fontSize: 22, color: colors.tableInk, paddingHorizontal: 4 },
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
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: 'center', lineHeight: 21 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  scoreName: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  scorePoints: { fontSize: 20, fontFamily: fonts.display, color: colors.ink },
  scoreUnit: { fontSize: 12, fontFamily: fonts.semibold, color: colors.muted },
  scoreHighlight: { color: colors.accent },
});

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(10,8,20,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { width: '100%', maxWidth: 400, maxHeight: '100%', backgroundColor: colors.bg, borderRadius: radius.panel, overflow: 'hidden' },
  panelScroll: { flexGrow: 0, flexShrink: 1 },
  panelBody: { padding: 20, gap: 12 },
  panelTitle: { fontSize: 22, fontFamily: fonts.display, color: colors.ink, textAlign: 'center' },
  handoffScroll: { flex: 1, backgroundColor: colors.table },
  handoff: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  handoffTitle: { fontSize: 26, fontFamily: fonts.display, color: colors.tableInk, textAlign: 'center' },
  handoffNote: { fontFamily: fonts.body, fontSize: 16, color: colors.tableMuted, textAlign: 'center' },
});
