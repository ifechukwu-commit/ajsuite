'use client'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <span
        className="relative inline-block w-9 h-5 rounded-full transition-colors"
        style={{ background: isDark ? 'var(--navy)' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: isDark ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  )
}
