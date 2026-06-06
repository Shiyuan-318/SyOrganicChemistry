/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'noto': ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        'chem-bg': '#0a0a0a',
        'chem-panel': '#0d0d1a',
        'chem-border': '#1a1a2e',
        'chem-accent': '#00ff88',
        'chem-muted': '#2a2a3e',
      },
    },
  },
  plugins: [],
};
