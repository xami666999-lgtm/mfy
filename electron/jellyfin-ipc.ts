import { ipcMain, app } from 'electron'
import {
  sidecarStatus,
  startSidecar,
  stopSidecar,
  pickPluginFile,
  installPluginFromUrl,
  openDashboard,
  openPluginFolder,
} from './jellyfin-sidecar'

export function setupJellyfinSidecar() {
  ipcMain.handle('jellyfin-status', () => sidecarStatus())
  ipcMain.handle('jellyfin-start', async () => {
    try { return await startSidecar() } catch (e: any) {
      return { ...sidecarStatus(), error: e?.message || String(e) }
    }
  })
  ipcMain.handle('jellyfin-stop', () => stopSidecar())
  ipcMain.handle('jellyfin-pick-plugin', async () => {
    try { return await pickPluginFile() } catch (e: any) {
      return { ...sidecarStatus(), error: e?.message || String(e) }
    }
  })
  ipcMain.handle('jellyfin-install-url', async (_e, url: string) => {
    try { return await installPluginFromUrl(String(url || '')) } catch (e: any) {
      return { ...sidecarStatus(), error: e?.message || String(e) }
    }
  })
  ipcMain.handle('jellyfin-open-dashboard', () => openDashboard())
  ipcMain.handle('jellyfin-open-plugins', () => openPluginFolder())
  app.on('before-quit', () => stopSidecar())
}
