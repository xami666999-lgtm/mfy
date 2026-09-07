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

function seekVideos(sec: number) {
  const n = Number(sec)
  if (!(n > 10)) return
  document.querySelectorAll('video').forEach((v) => {
    try {
      if (v.readyState >= 1 && Math.abs((v.currentTime || 0) - n) > 4) {
        v.currentTime = n
      }
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
}, 600)
