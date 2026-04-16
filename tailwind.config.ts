import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./mock/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        sand: "#f5efe3",
        brand: {
          50: "#f2f7f5",
          100: "#deebe5",
          200: "#bdd7cb",
          300: "#94bea9",
          400: "#699f84",
          500: "#4a876a",
          600: "#376e55",
          700: "#2c5845",
          800: "#254738",
          900: "#1f3b2f"
        },
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "\"PingFang SC\"", "\"Microsoft YaHei\"", "sans-serif"]
      },
      boxShadow: {
        panel: "0 16px 50px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
