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
