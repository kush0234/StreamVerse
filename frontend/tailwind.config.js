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
        shrink: {
          '0%':   { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      animation: {
        shrink: 'shrink linear forwards',
      },
    },
  },
  plugins: [],
}
