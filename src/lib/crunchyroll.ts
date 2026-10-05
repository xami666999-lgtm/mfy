const KEY = 'mfy-crunchy-login'

export function crunchySignedIn() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function saveCrunchyLogin() {
  try { localStorage.setItem(KEY, '1') } catch {}
}

export function crunchyLoginUrl() {
  return 'https://www.crunchyroll.com/login'
}

export function crunchyWatchUrl(title: string) {
  const q = encodeURIComponent(title.trim() || 'anime')
  return `https://www.crunchyroll.com/search?q=${q}`
}
