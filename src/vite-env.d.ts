export {}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      get: (key: string) => Promise<any>
      set: (key: string, value: any) => Promise<void>
      delete: (key: string) => Promise<void>
      openExternal: (url: string) => void
      selectFolder: () => Promise<string | null>
      showNotification: (title: string, body: string) => void
      isSetupComplete: () => Promise<boolean>
      setSetupComplete: () => Promise<void>
    }
  }
}
