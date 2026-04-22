/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0C447C',
          light:   '#E6F1FB',
          hover:   '#185FA5',
        },
        brand: {
          primary:   '#0C447C',
          secondary: '#1D9E75',
          purple:    '#7F77DD',
          danger:    '#E24B4A',
          warn:      '#BA7517',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
