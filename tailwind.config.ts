import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', sub: 'var(--sub)',
        line: 'var(--line)', accent: 'var(--accent)', 'accent-ink': 'var(--accent-ink)',
        danger: 'var(--danger)'
      }
    }
  },
  plugins: []
};
export default config;
