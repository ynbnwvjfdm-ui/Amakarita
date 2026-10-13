import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { dayNumber } from './dates';
import { Progress, emptyProgress, parseProgress, recordAnswer } from './game/progress';

const KEY = 'amakarita.progress.v1';

interface ProgressApi {
  progress: Progress;
  /** Records one answer by the person learning on this phone. */
  record: (cardId: string, correct: boolean) => void;
}

const ProgressContext = createContext<ProgressApi>({ progress: emptyProgress(), record: () => {} });

/** Keeps the learner's progress on the phone, so it is still there next time. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    // Storage can be missing (private browsing); the app then simply starts fresh each time.
    Promise.resolve()
      .then(() => AsyncStorage.getItem(KEY))
      .then((text) => {
        if (alive) setProgress((current) => (Object.keys(current.cards).length ? current : parseProgress(text)));
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
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(progress)))
      .catch(() => {});
  }, [progress, loaded]);

  const api = useMemo<ProgressApi>(
    () => ({
      progress,
      record: (cardId, correct) => setProgress((p) => recordAnswer(p, cardId, correct, dayNumber(new Date()))),
    }),
    [progress],
  );
  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
