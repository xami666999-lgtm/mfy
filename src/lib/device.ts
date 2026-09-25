export function isPhoneShell() {
  if (typeof window === 'undefined') return false
  try {
    const plat = (window as any).Capacitor?.getPlatform?.()
    if (plat === 'ios' || plat === 'android') return true
  } catch {}
  const ua = navigator.userAgent || ''
  return /iPhone|iPod|Android.+Mobile/i.test(ua)
}
