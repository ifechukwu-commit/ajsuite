import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        baskerville: ['var(--font-baskerville)', 'serif'],
      },
      colors: {
        navy: '#1B2B4B',
        gold: '#C9A84C',
      },
    },
  },
  plugins: [],
}

export default config
