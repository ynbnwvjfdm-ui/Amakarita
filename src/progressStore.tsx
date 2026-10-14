import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { dayNumber } from './dates';
import { Progress } from './game/progress';
import {
  Profile,
  ProfilesState,
  activeProfile,
  addProfile,
  initialProfiles,
  parseProfiles,
  progressOf,
  recordFor,
  removeProfile,
  setActive,
  updateProfile,
} from './game/profiles';

const KEY = 'amakarita.profiles.v1';
/** Where the first version kept a single learner's progress. */
const LEGACY_KEY = 'amakarita.progress.v1';

interface ProgressApi {
  profiles: Profile[];
  active: Profile;
  /** The active person's progress. */
  progress: Progress;
  progressOf: (profileId: string) => Progress;
  record: (profileId: string, cardId: string, correct: boolean) => void;
  add: (name: string, color: string) => void;
  update: (profileId: string, patch: { name?: string | null; color?: string }) => void;
  remove: (profileId: string) => void;
  switchTo: (profileId: string) => void;
}

const noop = () => {};
const start = initialProfiles();
const ProgressContext = createContext<ProgressApi>({
  profiles: start.profiles,
  active: start.profiles[0],
  progress: progressOf(start, start.active),
  progressOf: (id) => progressOf(start, id),
  record: noop,
  add: noop,
  update: noop,
  remove: noop,
  switchTo: noop,
});

const newId = () => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** Keeps every learner's progress on the phone, so it is still there next time. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(initialProfiles);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    // Storage can be missing (private browsing); the app then simply starts fresh each time.
    Promise.resolve()
      .then(() => Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LEGACY_KEY)]))
      .then(([text, legacy]) => {
        if (alive) setState(parseProfiles(text, legacy));
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    Promise.resolve()
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
      .catch(() => {});
  }, [state, loaded]);

  const api = useMemo<ProgressApi>(() => {
    const active = activeProfile(state);
    return {
      profiles: state.profiles,
      active,
      progress: progressOf(state, active.id),
      progressOf: (id) => progressOf(state, id),
      record: (id, cardId, correct) => setState((s) => recordFor(s, id, cardId, correct, dayNumber(new Date()))),
      add: (name, color) => setState((s) => addProfile(s, newId(), name, color)),
      update: (id, patch) => setState((s) => updateProfile(s, id, patch)),
      remove: (id) => setState((s) => removeProfile(s, id)),
      switchTo: (id) => setState((s) => setActive(s, id)),
    };
  }, [state]);
  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
