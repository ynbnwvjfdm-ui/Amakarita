/**
 * The people learning on one phone. Each has a name, a colour and their own
 * progress; one of them is "active" (whose progress the home screen shows).
 */

import { Progress, emptyProgress, parseProgress, recordAnswer } from './progress';

export const MAX_PROFILES = 8;
/** Avatar colours, easy to tell apart. */
export const PROFILE_COLORS = ['#5B4CF0', '#E4572E', '#2E9E5B', '#E8A33D', '#1F8FD6', '#C2367A', '#7A5230', '#3D3D3D'];

export interface Profile {
  id: string;
  /** null until the person writes a name: shown as "Wowe" / "You". */
  name: string | null;
  color: string;
}

export interface ProfilesState {
  version: 1;
  profiles: Profile[];
  active: string;
  progress: Record<string, Progress>;
}

/** One unnamed profile, carrying over progress saved before profiles existed. */
export function initialProfiles(legacy?: Progress): ProfilesState {
  return { version: 1, profiles: [{ id: 'p1', name: null, color: PROFILE_COLORS[0] }], active: 'p1', progress: { p1: legacy ?? emptyProgress() } };
}

export function activeProfile(s: ProfilesState): Profile {
  return s.profiles.find((p) => p.id === s.active) ?? s.profiles[0];
}

export function progressOf(s: ProfilesState, id: string): Progress {
  return s.progress[id] ?? emptyProgress();
}

/** The next colour not yet taken (or the first, when all are). */
export function freeColor(s: ProfilesState): string {
  return PROFILE_COLORS.find((c) => !s.profiles.some((p) => p.color === c)) ?? PROFILE_COLORS[0];
}

export function addProfile(s: ProfilesState, id: string, name: string, color: string): ProfilesState {
  if (s.profiles.length >= MAX_PROFILES || s.profiles.some((p) => p.id === id)) return s;
  return { ...s, profiles: [...s.profiles, { id, name: cleanName(name), color }], active: id, progress: { ...s.progress, [id]: emptyProgress() } };
}

export function updateProfile(s: ProfilesState, id: string, patch: { name?: string | null; color?: string }): ProfilesState {
  return {
    ...s,
    profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch, name: patch.name !== undefined ? cleanName(patch.name) : p.name } : p)),
  };
}

/** Removes a profile and its progress; the last one always stays. */
export function removeProfile(s: ProfilesState, id: string): ProfilesState {
  if (s.profiles.length <= 1) return s;
  const profiles = s.profiles.filter((p) => p.id !== id);
  const progress = { ...s.progress };
  delete progress[id];
  return { ...s, profiles, progress, active: s.active === id ? profiles[0].id : s.active };
}

export function setActive(s: ProfilesState, id: string): ProfilesState {
  return s.profiles.some((p) => p.id === id) ? { ...s, active: id } : s;
}

export function recordFor(s: ProfilesState, id: string, cardId: string, correct: boolean, day: number): ProfilesState {
  if (!s.profiles.some((p) => p.id === id)) return s;
  return { ...s, progress: { ...s.progress, [id]: recordAnswer(progressOf(s, id), cardId, correct, day) } };
}

function cleanName(name: string | null): string | null {
  const t = name?.trim();
  return t ? t.slice(0, 16) : null;
}

/** Reads saved profiles; without them, starts from progress saved by the older version. */
export function parseProfiles(text: string | null, legacyProgress: string | null): ProfilesState {
  try {
    const data = text ? JSON.parse(text) : null;
    if (data?.version === 1 && Array.isArray(data.profiles) && data.profiles.length && typeof data.progress === 'object') {
      const s = data as ProfilesState;
      return s.profiles.some((p) => p.id === s.active) ? s : { ...s, active: s.profiles[0].id };
    }
  } catch {
    // fall through to a fresh start
  }
  return initialProfiles(legacyProgress ? parseProgress(legacyProgress) : undefined);
}
