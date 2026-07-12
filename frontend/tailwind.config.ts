import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        surface: "#FFFFFF",
        background: "#F8FAFC",
        ink: "#0F172A",
        muted: "#64748B",
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE"
        },
        success: {
          DEFAULT: "#10B981",
          soft: "#D1FAE5"
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "#FEF3C7"
        },
        danger: {
          DEFAULT: "#EF4444",
          soft: "#FEE2E2"
        },
        hover: "#F1F5F9"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
