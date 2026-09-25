import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface ThemeContextType {
  theme: any;
  applyTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { currentTheme, themes, applyTheme } = useThemeStore();
  const [themeData, setThemeData] = useState<any>(null);

  useEffect(() => {
    const theme = themes.find(t => t.id === currentTheme);
    if (theme) setThemeData(theme.data);
  }, [currentTheme, themes]);

  return (
    <ThemeContext.Provider value={{ theme: themeData, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
