/**
 * Lightweight client-side cache with TTL for TMDB / metadata responses.
 * Uses memory + localStorage so data survives page reloads within the TTL window.
 */

interface CacheEntry<T> {
  data: T
  expires: number
}

const MEMORY = new Map<string, CacheEntry<unknown>>()
const PREFIX = 'mfy-cache:'
const DEFAULT_TTL_MS = 20 * 60 * 1000 // 20 minutes

function now() {
  return Date.now()
}

function storageKey(key: string) {
  return PREFIX + key
}

export function getCached<T>(key: string): T | null {
  // Memory first
  const mem = MEMORY.get(key)
  if (mem && mem.expires > now()) {
    return mem.data as T
  }
  if (mem) MEMORY.delete(key)

  // localStorage fallback
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.expires > now()) {
      MEMORY.set(key, entry)
      return entry.data
    }
    localStorage.removeItem(storageKey(key))
  } catch {
    // ignore parse / quota errors
  }
  return null
}

export function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  const entry: CacheEntry<T> = { data, expires: now() + ttlMs }
  MEMORY.set(key, entry)
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry))
  } catch {
    // quota exceeded – memory cache still works
  }
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    MEMORY.clear()
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(PREFIX)) keys.push(k)
      }
      keys.forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
    return
  }
  for (const k of MEMORY.keys()) {
    if (k.startsWith(prefix)) MEMORY.delete(k)
  }
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX + prefix)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

/** Convenience wrapper: returns cached value or runs fetcher and stores result */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const hit = getCached<T>(key)
  if (hit !== null) return hit
  const data = await fetcher()
  if (data !== null && data !== undefined) {
    setCache(key, data, ttlMs)
  }
  return data
}
