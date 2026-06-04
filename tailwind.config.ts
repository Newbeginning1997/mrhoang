import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182420",
        muted: "#64716D",
        primary: "#15745F",
        lagoon: "#2563EB",
        sun: "#D97706",
        rose: "#E11D48",
        paper: "#F8FAFC",
        mist: "#EEF7F4"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 116, 95, 0.14)",
        panel: "0 1px 2px rgba(15, 23, 42, 0.05), 0 18px 40px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
