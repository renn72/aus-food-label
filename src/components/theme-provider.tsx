import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Theme = 'dark' | 'light' | 'system'
const MEDIA = '(prefers-color-scheme: dark)'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// references:
// https://ui.shadcn.com/docs/dark-mode/vite
// https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme(storageKey, defaultTheme))

  const handleMediaQuery = useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme !== 'system') {
        return
      }

      applyThemeClass(e.matches ? 'dark' : 'light')
    },
    [theme],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia(MEDIA)

    media.addEventListener('change', handleMediaQuery)
    handleMediaQuery(media)

    return () => media.removeEventListener('change', handleMediaQuery)
  }, [handleMediaQuery])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let targetTheme: 'dark' | 'light'

    if (theme === 'system') {
      window.localStorage.removeItem(storageKey)
      targetTheme = window.matchMedia(MEDIA).matches ? 'dark' : 'light'
    } else {
      window.localStorage.setItem(storageKey, theme)
      targetTheme = theme
    }

    applyThemeClass(targetTheme)
  }, [theme, storageKey])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  )

  return (
    <ThemeProviderContext value={value}>
      {children}
    </ThemeProviderContext>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

function getStoredTheme(storageKey: string, defaultTheme: Theme) {
  if (typeof window === 'undefined') {
    return defaultTheme
  }

  const storedTheme = window.localStorage.getItem(storageKey)

  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme
  }

  return defaultTheme
}

function applyThemeClass(theme: 'light' | 'dark') {
  const rootElement = window.document.documentElement

  rootElement.classList.remove('light', 'dark')
  rootElement.classList.add(theme)
}
