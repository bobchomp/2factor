import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f4f5f7",
        panel: "#ffffff",
        border: "#e2e4ea",
        accent: "#2563eb",
      },
    },
  },
  plugins: [],
};

export default config;
