const pinkey = {
  100: "#FFCAF7",
  500: "#FF5FE5",
  900: "#150423",
  gradient: {
    colors: ["#FF5FE5", "#FF5F72"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const orangy = {
  100: "#FFC9C9",
  500: "#FF5F5F",
  900: "#1C0A00",
  gradient: {
    colors: ["#FF5F5F", "#FF995F"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const greeny = {
  100: "#CBFFE3",
  500: "#5FFF95",
  900: "#021600",
  gradient: {
    colors: ["#5FFF95", "#5FFFEC"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const blueey = {
  100: "#CBF9FF",
  500: "#5FB2FF",
  900: "#001428",
  gradient: {
    colors: ["#5FB2FF", "#18FFF1"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const sunny = {
  100: "#FFC9C9",
  500: "#FFAD33",
  900: "#241800",
  gradient: {
    colors: ["#FFBF5F", "#DFFF5F"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const limey = {
  100: "#FFFED9",
  500: "#CCFF5F",
  900: "#0B1A00",
  gradient: {
    colors: ["#FFF95F", "#BCFF4E"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

const themes = [sunny, limey, blueey, pinkey, orangy, greeny];

const theme = themes[Math.floor(Math.random() * themes.length)];

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { theme },
      textColor: { theme },
      backgroundColor: { theme },
      ringColor: { theme },
    },
  },
  plugins: [],
};

module.exports = config;
