import { useEffect, useState } from 'react'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export default function InstallButton() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null)
  const [hide, setHide] = useState(() => {
    if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) return true
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return true
    return false
  })

  const [iosTip, setIosTip] = useState(false)
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as PromptEvent)
    }
    const onInstalled = () => setHide(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hide) return null
  if (ios) {
    return (
      <span style={{ position: 'relative' }}>
        <button type="button" className="nav-install" onClick={() => setIosTip((v) => !v)}>Add to Home Screen</button>
        {iosTip && <span className="nav-install-tip">Tap Share, then Add to Home Screen.</span>}
      </span>
    )
  }
  if (!prompt) return null

  return (
    <button
      type="button"
      className="nav-install"
      onClick={async () => {
        await prompt.prompt()
        setPrompt(null)
      }}
    >
      Install to desktop
    </button>
  )
}
