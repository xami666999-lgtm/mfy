import { ipcRenderer } from 'electron'

window.addEventListener('mousemove', () => {
  try { ipcRenderer.sendToHost('mfy-mm') } catch {}
}, true)

function videos(): HTMLVideoElement[] {
  return Array.from(document.querySelectorAll('video'))
}

ipcRenderer.on('mfy-seek', (_e, sec) => {
  const n = Number(sec)
  if (!(n > 20)) return
  videos().forEach((v) => {
    try {
      if (v.readyState >= 1 && (v.currentTime || 0) < 20) v.currentTime = n
    } catch {}
  })
})

setInterval(() => {
  const v = videos().sort((a, b) => (b.currentTime || 0) - (a.currentTime || 0))[0]
  if (!v) return
  const p = Number(v.currentTime) || 0
  const d = Number(v.duration) || 0
  if (p > 3) {
    try { ipcRenderer.sendToHost('mfy-time', { p, d: Number.isFinite(d) ? d : 0 }) } catch {}
  }
}, 1000)
