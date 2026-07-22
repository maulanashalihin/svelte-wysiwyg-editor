/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/**/*.svelte'],
  // Use class-based dark mode so dark: variants compile to .dark *
  // selectors instead of @media (prefers-color-scheme: dark).
  // This matches the most common Tailwind dark mode strategy and
  // allows consumers to toggle dark mode via a .dark class on <html>.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
