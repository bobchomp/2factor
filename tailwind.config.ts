import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f3f6fc",
        panel: "#ffffff",
        border: "#e1e7f2",
        accent: "#2563eb",
        "accent-soft": "#eaf1ff",
        ink: "#1c2333",
        muted: "#5b6478",
        danger: "#e15252",
        warn: "#e0a239",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "22px",
        control: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28, 35, 51, 0.03), 0 10px 24px rgba(28, 35, 51, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
