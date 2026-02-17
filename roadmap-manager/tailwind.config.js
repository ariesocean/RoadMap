/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        '2xs': '320px',
      },
      colors: {
        primary: '#0078D4',
        'background': '#FFFFFF',
        'secondary-bg': '#F8F9FA',
        'card-bg': '#FFFFFF',
        'primary-text': '#323130',
        'secondary-text': '#605E5C',
        'placeholder-text': '#A19F9D',
        'border-color': '#E1DFDD',
        'card-border': '#F3F2F1',
        'dark-background': '#1E1E1E',
        'dark-secondary-bg': '#2D2D2D',
        'dark-card-bg': '#2D2D2D',
        'dark-primary-text': '#FFFFFF',
        'dark-secondary-text': '#A0A0A0',
        'dark-placeholder-text': '#6B6B6B',
        'dark-border-color': '#3D3D3D',
        'dark-card-border': '#3D3D3D',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'input': '0 -2px 8px rgba(0, 0, 0, 0.05)',
        'dark-card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'dark-card-hover': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}