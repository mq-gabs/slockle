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

/** Prefix for every key this game stores. */
export const KEY_PREFIX = 'slockle-';
const LEGACY_PREFIX = 'pattern-lock-'; // the game's name before it became Slockle

export const SEEN_HELP_KEY = `${KEY_PREFIX}seen-help`;
const PLAYER_KEY = `${KEY_PREFIX}player`;

/** Moves keys saved under the old name, so a rename doesn't lose progress or the player id. */
function migrateLegacyKeys(): void {
  try {
    const legacy = Object.keys(localStorage).filter((k) => k.startsWith(LEGACY_PREFIX));
    for (const old of legacy) {
      const renamed = KEY_PREFIX + old.slice(LEGACY_PREFIX.length);
      const value = localStorage.getItem(old);
      if (value !== null && localStorage.getItem(renamed) === null) localStorage.setItem(renamed, value);
      localStorage.removeItem(old);
    }
  } catch {
    /* storage blocked: nothing to migrate */
  }
}
migrateLegacyKeys();

/** Anonymous id for the server's stats; created once per browser. */
export function playerId(): string {
  let id = storage.get<string>(PLAYER_KEY, '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = crypto.randomUUID();
    storage.set(PLAYER_KEY, id);
  }
  return id;
}
