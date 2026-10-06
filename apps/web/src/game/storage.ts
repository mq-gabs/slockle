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

/**
 * A random v4 UUID. crypto.randomUUID only exists in secure contexts (HTTPS or localhost), so
 * over plain HTTP, e.g. `npm run dev:lan` opened by IP on a phone, build one from getRandomValues,
 * which works everywhere.
 */
function randomUUID(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40; // version 4
  b[8] = (b[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Anonymous id for the server's stats; created once per browser. */
export function playerId(): string {
  let id = storage.get<string>(PLAYER_KEY, '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = randomUUID();
    storage.set(PLAYER_KEY, id);
  }
  return id;
}
