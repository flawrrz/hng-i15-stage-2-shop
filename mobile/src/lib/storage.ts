import { Platform } from 'react-native';

/**
 * React Native has no localStorage, which Supabase (for session persistence)
 * and zustand (for the cart) both rely on. expo-sqlite ships a localStorage
 * implementation — install it on native only, because on web a real
 * localStorage already exists and expo-sqlite is a native module.
 */
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-sqlite/localStorage/install');
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const globalStorage = (globalThis as { localStorage?: KeyValueStorage })
  .localStorage;

/**
 * During static web prerendering there is no localStorage, so fall back to an
 * in-memory store there. On device and in the browser the real storage wins.
 */
export const appStorage: KeyValueStorage = globalStorage ?? createMemoryStorage();
