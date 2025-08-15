'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key for theme preference
const THEME_STORAGE_KEY = 'saga-theme-preference';

// Media query for system theme detection
const DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get initial theme from localStorage or default to system
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }, []);

  // Resolve theme based on preference and system settings
  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: 'light' | 'dark' = 'light';

      if (theme === 'dark') {
        resolved = 'dark';
      } else if (theme === 'light') {
        resolved = 'light';
      } else {
        // System theme
        resolved = window.matchMedia(DARK_THEME_QUERY).matches ? 'dark' : 'light';
      }

      setResolvedTheme(resolved);

      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = resolved === 'dark' ? '#0f172a' : '#ffffff';
        document.head.appendChild(meta);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia(DARK_THEME_QUERY);
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for component-specific theme overrides
export function useComponentTheme(componentTheme?: 'light' | 'dark') {
  const { resolvedTheme } = useTheme();
  
  return componentTheme || resolvedTheme;
}

// Hook for theme-aware styles
export function useThemeStyles() {
  const { resolvedTheme } = useTheme();
  
  return {
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    
    // Common theme-aware class combinations
    bg: resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white',
    bgSecondary: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
    text: resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900',
    textSecondary: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    textMuted: resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    border: resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    borderFocus: resolvedTheme === 'dark' ? 'border-gray-500' : 'border-gray-400',
    
    // Input styles
    input: resolvedTheme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    
    // Card styles
    card: resolvedTheme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200',
    
    // Button variants
    buttonPrimary: resolvedTheme === 'dark'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    
    buttonSecondary: resolvedTheme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300',
  };
}

// Helper function to get theme-aware image source
export function getThemedImageSrc(lightSrc: string, darkSrc: string, theme?: 'light' | 'dark') {
  const { resolvedTheme } = useTheme();
  const currentTheme = theme || resolvedTheme;
  return currentTheme === 'dark' ? darkSrc : lightSrc;
}

// CSS-in-JS helper for theme-aware styles
export function createThemeAwareStyles(styles: {
  light: React.CSSProperties;
  dark: React.CSSProperties;
  common?: React.CSSProperties;
}) {
  const { resolvedTheme } = useTheme();
  
  return {
    ...styles.common,
    ...styles[resolvedTheme],
  };
}