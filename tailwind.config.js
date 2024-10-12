/*eslint-env node*/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}', // Adjust to include only your source files
    './public/**/*.html'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
