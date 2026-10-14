/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#89A482",
          hover: "#758E6F",
          dark: "#5C6F57",
          light: "#B1C5AA",
          soft: "#D9E5D6",
          bg: "#EBF2E8",
        },
        sage: {
          DEFAULT: "#89A482",
          dark: "#5C6F57",
          light: "#B1C5AA",
          soft: "#D9E5D6",
          bg: "#EBF2E8",
        },
      },
    },
  },
  plugins: [],
};
