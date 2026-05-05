/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        confetti: {
          '0%': {
            transform: 'translate(-50%, -50%) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translate(calc(-50% + (var(--random-x) * 400px)), calc(-50% + (var(--random-y) * 400px) + 200px)) rotate(720deg)',
            opacity: '0',
          },
        },
      },
      animation: {
        confetti: 'confetti 3s ease-out forwards',
      },
    },
  },
  plugins: [],
} 