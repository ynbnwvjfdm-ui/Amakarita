import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { countKnown } from '../game/progress';
import { MAX_PROFILES, PROFILE_COLORS, Profile } from '../game/profiles';
import { useI18n } from '../i18n';
import { useProgress } from '../progressStore';
import { QUESTIONS } from '../questions';
import { Button } from './Button';
import { LanguageToggle } from './LanguageToggle';
import { Panel } from './table';
import { colors, fonts, radius } from './theme';

const ALL_CARDS = Object.keys(QUESTIONS);

/** The top-right of each tab: who is playing, and the language switch. */
export function HeaderActions() {
  return (
    <View style={styles.actions}>
      <ProfileButton />
      <LanguageToggle />
    </View>
  );
}

/** A round badge in the person's colour with the first letter of their name. */
export function Avatar({ profile, size = 36 }: { profile: Pick<Profile, 'name' | 'color'>; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: profile.color }]}>
      {profile.name ? (
        <Text style={[styles.avatarText, { fontSize: size * 0.44 }]}>{profile.name.charAt(0).toUpperCase()}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color="#FFFFFF" />
      )}
    </View>
  );
}

type Mode = { kind: 'list' } | { kind: 'edit'; id: string | null; name: string; color: string } | { kind: 'confirm'; id: string };

/** The active person's badge; tap it to switch person, add one, or change a name. */
export function ProfileButton() {
  const { t } = useI18n();
  const { profiles, active, progressOf, switchTo, add, update, remove } = useProgress();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const label = (p: Profile) => p.name ?? t('you');
  const close = () => {
    setOpen(false);
    setMode({ kind: 'list' });
  };
  const nextColor = PROFILE_COLORS.find((c) => !profiles.some((p) => p.color === c)) ?? PROFILE_COLORS[0];

  let body;
  if (mode.kind === 'edit') {
    const save = () => {
      if (mode.id) update(mode.id, { name: mode.name, color: mode.color });
      else add(mode.name, mode.color);
      setMode({ kind: 'list' });
    };
    body = (
      <>
        <View style={styles.editHead}>
          <Avatar profile={{ name: mode.name.trim() || null, color: mode.color }} size={56} />
        </View>
        <TextInput
          style={styles.input}
          value={mode.name}
          onChangeText={(name) => setMode({ ...mode, name })}
          placeholder={t('nameLabel')}
          placeholderTextColor={colors.muted}
          maxLength={16}
          accessibilityLabel={t('nameLabel')}
        />
        <View style={styles.swatches}>
          {PROFILE_COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: c === mode.color }}
              accessibilityLabel={c}
              onPress={() => setMode({ ...mode, color: c })}
              style={[styles.swatch, { backgroundColor: c }, c === mode.color && styles.swatchOn]}
            />
          ))}
        </View>
        <Button variant="lime" label={t('save')} onPress={save} />
        <Button variant="secondary" label={t('cancel')} onPress={() => setMode({ kind: 'list' })} />
        {mode.id && profiles.length > 1 ? (
          <Pressable accessibilityRole="button" onPress={() => setMode({ kind: 'confirm', id: mode.id! })} style={styles.removeLink}>
            <Ionicons name="trash-outline" size={16} color={colors.coral} />
            <Text style={styles.removeText}>{t('remove')}</Text>
          </Pressable>
        ) : null}
      </>
    );
  } else if (mode.kind === 'confirm') {
    const p = profiles.find((x) => x.id === mode.id);
    body = (
      <>
        <Text style={styles.confirm}>{t('removeConfirm', { name: p ? label(p) : '' })}</Text>
        <Button
          label={t('remove')}
          onPress={() => {
            remove(mode.id);
            setMode({ kind: 'list' });
          }}
        />
        <Button variant="secondary" label={t('cancel')} onPress={() => setMode({ kind: 'list' })} />
      </>
    );
  } else {
    body = (
      <>
        {profiles.map((p) => {
          const on = p.id === active.id;
          return (
            <View key={p.id} style={[styles.row, on && styles.rowOn]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label(p)}
                onPress={() => {
                  switchTo(p.id);
                  close();
                }}
                style={styles.rowMain}
              >
                <Avatar profile={p} size={40} />
                <View style={styles.rowTexts}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {label(p)}
                  </Text>
                  <Text style={styles.rowSub}>{t('knownOf', { n: countKnown(progressOf(p.id), ALL_CARDS), total: ALL_CARDS.length })}</Text>
                </View>
                {on ? <Ionicons name="checkmark-circle" size={22} color={colors.ink} /> : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('nameLabel')}: ${label(p)}`}
                onPress={() => setMode({ kind: 'edit', id: p.id, name: p.name ?? '', color: p.color })}
                style={styles.edit}
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={20} color={colors.ink} />
              </Pressable>
            </View>
          );
        })}
        {profiles.length < MAX_PROFILES ? (
          <Button variant="lime" label={t('addProfile')} onPress={() => setMode({ kind: 'edit', id: null, name: '', color: nextColor })} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('changePlayer')}: ${label(active)}`} onPress={() => setOpen(true)} hitSlop={6}>
        <Avatar profile={active} />
      </Pressable>
      <Panel visible={open} title={mode.kind === 'edit' && !mode.id ? t('addProfile') : t('profilesTitle')} onRequestClose={close}>
        {body}
        {mode.kind === 'list' ? <Button variant="secondary" label={t('continue')} onPress={close} /> : null}
      </Panel>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, color: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, padding: 8, backgroundColor: colors.surface },
  rowOn: { borderWidth: 1.5, borderColor: colors.ink, padding: 6.5 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  rowTexts: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  edit: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  editHead: { alignItems: 'center' },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  swatch: { width: 34, height: 34, borderRadius: 17 },
  swatchOn: { borderWidth: 3, borderColor: colors.ink },
  removeLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40 },
  removeText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.coral },
  confirm: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink, textAlign: 'center' },
});
