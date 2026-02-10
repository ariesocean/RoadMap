/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0078D4',
        background: '#FFFFFF',
        'secondary-bg': '#F8F9FA',
        'card-bg': '#FFFFFF',
        'primary-text': '#323130',
        'secondary-text': '#605E5C',
        'placeholder-text': '#A19F9D',
        'border-color': '#E1DFDD',
        'card-border': '#F3F2F1',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'input': '0 -2px 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}