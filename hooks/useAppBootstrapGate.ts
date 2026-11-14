import { useEffect, useState } from 'react';

/** Minimální délka brand cold startu (auth + vizuál). */
const MIN_BOOTSTRAP_MS = 2000;

export function useAppBootstrapGate(isAuthLoading: boolean): boolean {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinTimeElapsed(true), MIN_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, []);

  return isAuthLoading || !minTimeElapsed;
}