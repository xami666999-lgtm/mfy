import { useEffect } from 'react'
import { useStore } from '../store'

/**
 * Global keyboard / remote-friendly shortcuts.
 * Arrow keys can be extended later for full spatial navigation.
 */
export function useKeyboardNav() {
  const { currentPage, setCurrentPage, isSetupComplete } = useStore()

  useEffect(() => {
    if (!isSetupComplete) return

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }

      // Number keys / letters for quick nav
      if (e.key === '1' || (e.key === 'h' && !e.metaKey && !e.ctrlKey)) {
        setCurrentPage('home')
      } else if (e.key === '2' || e.key === 'd') {
        setCurrentPage('discover')
      } else if (e.key === '3' || e.key === 's') {
        setCurrentPage('search')
      } else if (e.key === '4' || e.key === 'l') {
        setCurrentPage('library')
      } else if (e.key === '5' || (e.key === ',' && e.ctrlKey)) {
        setCurrentPage('settings')
      } else if (e.key === 'Escape') {
        if (currentPage === 'player' || currentPage === 'detail') {
          setCurrentPage('home')
        }
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setCurrentPage('search')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, setCurrentPage, isSetupComplete])
}
