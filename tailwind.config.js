/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/**/*.svelte'],
  // Minimal theme — we only need the default utilities that the
  // components use inline. Consumer's own Tailwind config handles
  // theme customization; this file just generates the raw utility
  // classes so they exist in the consumer's CSS even though their
  // content scanner can't see node_modules.
  theme: {
    extend: {},
  },
  plugins: [],
};
