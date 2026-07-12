import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        surface: "hsl(0 0% 100%)",
        ink: "hsl(222 47% 11%)",
        muted: "hsl(215 16% 47%)",
        brand: {
          DEFAULT: "hsl(173 80% 32%)",
          dark: "hsl(184 84% 22%)",
          light: "hsl(166 76% 94%)"
        },
        accent: {
          DEFAULT: "hsl(36 94% 52%)",
          soft: "hsl(39 100% 94%)"
        },
        danger: {
          DEFAULT: "hsl(0 78% 56%)",
          soft: "hsl(0 86% 97%)"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
