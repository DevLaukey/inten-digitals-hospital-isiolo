const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // Change this one line to rebrand the whole app.
      colors: { brand: colors.teal },
    },
  },
  plugins: [],
};
