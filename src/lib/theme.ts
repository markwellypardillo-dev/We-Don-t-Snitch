import { useState, useEffect } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'wds_theme_preference';

export function getStoredThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'system';
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(pref: ThemePreference): ResolvedTheme {
  const resolved = pref === 'system' ? getSystemTheme() : pref;
  const root = document.documentElement;
  
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }

  root.setAttribute('data-theme', resolved);
  return resolved;
}

export function saveThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
    window.dispatchEvent(new Event('wds_theme_changed'));
  } catch {
    // ignore
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const pref = getStoredThemePreference();
    return pref === 'system' ? getSystemTheme() : pref;
  });

  useEffect(() => {
    // Apply initial
    const currentPref = getStoredThemePreference();
    const resolved = applyTheme(currentPref);
    setThemeState(currentPref);
    setResolvedTheme(resolved);

    // Listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const activePref = getStoredThemePreference();
      if (activePref === 'system') {
        const newResolved = applyTheme('system');
        setResolvedTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen to custom theme change event across tabs/components
    const handleStorage = () => {
      const newPref = getStoredThemePreference();
      setThemeState(newPref);
      const res = applyTheme(newPref);
      setResolvedTheme(res);
    };

    window.addEventListener('wds_theme_changed', handleStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('wds_theme_changed', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (newPref: ThemePreference) => {
    setThemeState(newPref);
    saveThemePreference(newPref);
    const resolved = applyTheme(newPref);
    setResolvedTheme(resolved);
  };

  return { theme, resolvedTheme, setTheme };
}
