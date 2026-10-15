import { describe, expect, it } from '@jest/globals';
import { emptyProgress, recordAnswer } from '../progress';
import {
  MAX_PROFILES,
  activeProfile,
  addProfile,
  freeColor,
  initialProfiles,
  parseProfiles,
  progressOf,
  recordFor,
  removeProfile,
  setActive,
  updateProfile,
} from '../profiles';

describe('profiles', () => {
  it('starts with one unnamed profile, keeping progress saved before profiles existed', () => {
    const legacy = recordAnswer(emptyProgress(), 'imvugo-2C', true, 5);
    const s = parseProfiles(null, JSON.stringify(legacy));
    expect(s.profiles).toHaveLength(1);
    expect(activeProfile(s).name).toBeNull();
    expect(progressOf(s, s.active)).toEqual(legacy);
  });

  it('adds a profile with its own empty progress and makes it active', () => {
    let s = initialProfiles();
    s = addProfile(s, 'p2', '  Keza  ', freeColor(s));
    expect(activeProfile(s)).toEqual({ id: 'p2', name: 'Keza', color: s.profiles[1].color });
    expect(s.profiles[1].color).not.toBe(s.profiles[0].color);
    expect(progressOf(s, 'p2')).toEqual(emptyProgress());
  });

  it('keeps each person’s answers apart', () => {
    let s = addProfile(initialProfiles(), 'p2', 'Keza', '#000');
    s = recordFor(s, 'p1', 'a', true, 1);
    s = recordFor(s, 'p2', 'a', false, 1);
    expect(progressOf(s, 'p1').cards.a.box).toBe(1);
    expect(progressOf(s, 'p2').cards.a.box).toBe(0);
    expect(recordFor(s, 'nobody', 'a', true, 1)).toBe(s);
  });

  it('renames, switches and removes, always keeping one profile', () => {
    let s = addProfile(initialProfiles(), 'p2', 'Keza', '#000');
    s = updateProfile(s, 'p1', { name: 'Mama' });
    expect(s.profiles[0].name).toBe('Mama');
    s = updateProfile(s, 'p1', { name: '   ' });
    expect(s.profiles[0].name).toBeNull();
    s = setActive(s, 'p1');
    expect(s.active).toBe('p1');
    s = removeProfile(s, 'p1');
    expect(s.profiles.map((p) => p.id)).toEqual(['p2']);
    expect(s.active).toBe('p2');
    expect(s.progress.p1).toBeUndefined();
    expect(removeProfile(s, 'p2')).toBe(s);
  });

  it(`allows at most ${MAX_PROFILES} profiles`, () => {
    let s = initialProfiles();
    for (let i = 2; i <= MAX_PROFILES + 3; i++) s = addProfile(s, `p${i}`, `P${i}`, freeColor(s));
    expect(s.profiles).toHaveLength(MAX_PROFILES);
  });

  it('reads back what was saved, and ignores anything broken', () => {
    const s = recordFor(addProfile(initialProfiles(), 'p2', 'Keza', '#000'), 'p2', 'x', true, 3);
    expect(parseProfiles(JSON.stringify(s), null)).toEqual(s);
    expect(parseProfiles('broken', null)).toEqual(initialProfiles());
    expect(parseProfiles(JSON.stringify({ ...s, active: 'gone' }), null).active).toBe('p1');
  });
});
