import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Theme, ThemeConfig, ThemeId } from '../types'
import { builtInThemes } from './builtInThemes'

interface ThemeState {
  activeTheme: Theme | null
  availableThemes: Theme[]
  isLoading: boolean
  loadThemes: () => Promise<void>
  setActiveTheme: (themeId: string) => Promise<void>
  installTheme: (themePath: string) => Promise<{ success: boolean; error?: string }>
  getThemeCSSVariables: (theme: Theme) => Record<string, string>
  applyTheme: (theme: Theme) => void
}

const DEFAULT_THEME_ID = 'mfy-modern'

function generateCSSVariables(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = {}
  const config = theme.config
  
  // Colors
  Object.entries(config.colors).forEach(([key, value]) => {
    vars[`--color-${kebabCase(key)}`] = value
  })
  
  // Fonts
  vars['--font-display'] = config.fonts.display
  vars['--font-heading'] = config.fonts.heading
  vars['--font-body'] = config.fonts.body
  vars['--font-mono'] = config.fonts.mono
  vars['--font-ui'] = config.fonts.ui
  
  Object.entries(config.fonts.sizes).forEach(([key, value]) => {
    vars[`--font-size-${key}`] = value
  })
  
  Object.entries(config.fonts.weights).forEach(([key, value]) => {
    vars[`--font-weight-${key}`] = value.toString()
  })
  
  // Spacing
  Object.entries(config.spacing).forEach(([key, value]) => {
    vars[`--spacing-${key}`] = value
  })
  
  // Border Radius
  Object.entries(config.borderRadius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value
  })
  
  // Shadows
  Object.entries(config.shadows).forEach(([key, value]) => {
    vars[`--shadow-${key}`] = value
  })
  
  // Transitions
  Object.entries(config.transitions).forEach(([key, value]) => {
    vars[`--transition-${key}`] = value
  })
  
  // Background Effects
  vars['--bg-effect-enabled'] = config.backgroundEffects.enabled ? '1' : '0'
  vars['--bg-effect-type'] = config.backgroundEffects.type
  vars['--bg-effect-intensity'] = config.backgroundEffects.intensity.toString()
  
  // Information Density
  vars['--info-density'] = config.informationDensity
  
  // Layout specific
  const layouts = theme.layouts
  vars['--home-layout'] = layouts.home.type
  vars['--games-layout'] = layouts.games.type
  vars['--systems-layout'] = layouts.systems.type
  vars['--game-card-aspect'] = layouts.gameCard.aspectRatio
  vars['--game-card-hover'] = layouts.gameCard.hoverEffect
  vars['--navigation-type'] = layouts.navigation.type
  vars['--navigation-position'] = layouts.navigation.position
  
  return vars
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function applyCSSVariables(variables: Record<string, string>): void {
  const root = document.documentElement
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // Update theme attribute for CSS selectors
  root.setAttribute('data-theme', Object.keys(variables).find(k => k.includes('primary'))?.split('-')[1] || 'default')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeTheme: null,
      availableThemes: [],
      isLoading: false,
      
      loadThemes: async () => {
        set({ isLoading: true })
        try {
          const { databaseService } = await import('../services/database')
          
          // Load built-in themes
          const builtIn = Object.values(builtInThemes)
          
          // Load custom themes from database
          const dbThemes = await databaseService.getThemes()
          
          // Merge, with database themes taking precedence for custom ones
          const allThemes = [...builtIn]
          for (const dbTheme of dbThemes) {
            if (!dbTheme.isBuiltIn) {
              const existingIndex = allThemes.findIndex(t => t.id === dbTheme.id)
              if (existingIndex >= 0) {
                allThemes[existingIndex] = dbTheme
              } else {
                allThemes.push(dbTheme)
              }
            }
          }
          
          // Find active theme
          let activeTheme = allThemes.find(t => t.isActive)
          if (!activeTheme) {
            activeTheme = allThemes.find(t => t.id === DEFAULT_THEME_ID) || allThemes[0]
          }
          
          set({ availableThemes: allThemes, activeTheme, isLoading: false })
          
          if (activeTheme) {
            get().applyTheme(activeTheme)
          }
        } catch (error) {
          console.error('Failed to load themes:', error)
          set({ isLoading: false })
        }
      },
      
      setActiveTheme: async (themeId: string) => {
        const { availableThemes, applyTheme } = get()
        const theme = availableThemes.find(t => t.id === themeId)
        if (!theme) return
        
        try {
          const { databaseService } = await import('../services/database')
          await databaseService.setActiveTheme(themeId)
          
          const updatedThemes = availableThemes.map(t => ({
            ...t,
            isActive: t.id === themeId,
          }))
          
          set({ activeTheme: theme, availableThemes: updatedThemes })
          applyTheme(theme)
        } catch (error) {
          console.error('Failed to set active theme:', error)
        }
      },
      
      installTheme: async (themePath: string) => {
        try {
          const result = await window.electronAPI.themeInstall(themePath)
          if (result.success) {
            await get().loadThemes()
          }
          return result
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },
      
      getThemeCSSVariables: (theme: Theme) => {
        return generateCSSVariables(theme)
      },
      
      applyTheme: (theme: Theme) => {
        const variables = generateCSSVariables(theme)
        applyCSSVariables(variables)
        
        // Dispatch event for components to react
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
      },
    }),
    {
      name: 'mfy-theme-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTheme: state.activeTheme ? { id: state.activeTheme.id } : null,
      }),
    }
  )
)

export const themeEngine = {
  getCSSVariables: generateCSSVariables,
  applyTheme: applyCSSVariables,
  kebabCase,
}

// Initialize on client side
if (typeof window !== 'undefined') {
  useThemeStore.getState().loadThemes()
}