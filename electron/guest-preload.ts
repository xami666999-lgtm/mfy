import { ipcRenderer } from 'electron'

window.addEventListener('mousemove', () => {
  try { ipcRenderer.sendToHost('mfy-mm') } catch {}
}, true)

window.addEventListener('mousedown', (e) => {
  if (e.clientX < 160 && e.clientY < 70) {
    e.preventDefault()
    e.stopPropagation()
    try { ipcRenderer.sendToHost('mfy-exit') } catch {}
  }
}, true)

let target = 0
let until = 0

function videos(): HTMLVideoElement[] {
  return Array.from(document.querySelectorAll('video'))
}

function seekVideos(sec: number) {
  const n = Number(sec)
  if (!(n > 10)) return
  videos().forEach((v) => {
    try {
      if (v.readyState >= 1 && Math.abs((v.currentTime || 0) - n) > 4) v.currentTime = n
    } catch {}
  })
}

ipcRenderer.on('mfy-seek', (_e, sec) => {
  target = Number(sec) || 0
  until = Date.now() + 25000
  seekVideos(target)
})

setInterval(() => {
  if (target > 10 && Date.now() < until) seekVideos(target)
  const v = videos().sort((a, b) => (b.currentTime || 0) - (a.currentTime || 0))[0]
  if (!v) return
  const p = Number(v.currentTime) || 0
  const d = Number(v.duration) || 0
  if (p > 3) {
    try { ipcRenderer.sendToHost('mfy-time', { p, d: Number.isFinite(d) ? d : 0 }) } catch {}
  }
}, 800)
