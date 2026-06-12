/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        dev: {
          green: '#2db55c',      // Vibrant LeetCode Green
          'green-hover': '#228f48',
          bg: '#FFFFFF',
          text: '#222222',       // Dark Gray/Black Text
          border: '#E5E7EB',     // Light Gray Border
          'light-green': '#ebf7ee', // Fresh light green background for tags
          'dark-green': '#1ba94c',  // Rich green text for tags
        }
      },
      boxShadow: {
        dev: '0 2px 8px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
