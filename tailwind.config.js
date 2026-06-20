/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './hooks/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        heading: ['BricolageGrotesque_700Bold'],
        sans: ['DMSans_400Regular'],
      },
      colors: {
        accent: '#EB0031',
      },
    },
  },
  plugins: [],
};
