import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const THEME_STORAGE_KEY = 'traceon_theme';
const DEFAULT_THEME = 'light';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (err) {
      console.warn('[TraceOn] Error reading theme from localStorage:', err);
    }
    return DEFAULT_THEME;
  });

  // Apply theme to DOM immediately
  const applyThemeToDOM = (activeTheme) => {
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme', activeTheme);
      if (activeTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Update mobile status bar theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', activeTheme === 'dark' ? '#0C0F17' : '#F6F7F9');
      }
    } catch (err) {
      console.warn('[TraceOn] Error applying theme to DOM:', err);
    }
  };

  useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    } catch (err) {
      console.warn('[TraceOn] Error saving theme to localStorage:', err);
    }
    applyThemeToDOM(validTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
