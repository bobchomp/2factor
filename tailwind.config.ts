import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#12151c",
        border: "#232733",
        accent: "#4f7cff",
      },
    },
  },
  plugins: [],
};

export default config;
