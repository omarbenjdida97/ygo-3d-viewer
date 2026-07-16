/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '20%, 60%': { transform: 'translate(-6px, 6px)' },
          '40%, 80%': { transform: 'translate(6px, -6px)' },
        }
      },
      animation: {
        shake: 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both',
      }
    },
  },
  plugins: [],
}
