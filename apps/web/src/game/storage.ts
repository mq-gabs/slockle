// localStorage with every access guarded: private windows and blocked storage just play without saving.

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* not saved; the game still works */
    }
  },
};

export const SEEN_HELP_KEY = 'pattern-lock-seen-help';
const PLAYER_KEY = 'pattern-lock-player';

/** Anonymous id for the server's stats; created once per browser. */
export function playerId(): string {
  let id = storage.get<string>(PLAYER_KEY, '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = crypto.randomUUID();
    storage.set(PLAYER_KEY, id);
  }
  return id;
}
