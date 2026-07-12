import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // CSS-variable-driven (theme-aware)
        white: "var(--color-surface)",
        slate: {
          50: "var(--color-slate-50)",
          100: "var(--color-slate-100)",
          200: "var(--color-slate-200)",
          300: "var(--color-slate-300)",
          400: "var(--color-slate-400)",
          500: "var(--color-slate-500)",
          600: "var(--color-slate-600)",
          700: "var(--color-slate-700)",
          800: "var(--color-slate-800)",
          900: "var(--color-slate-900)",
        },
        border: "var(--color-border)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        background: "var(--color-background)",
        ink: "var(--color-ink)",
        "ink-secondary": "var(--color-ink-secondary)",
        muted: "var(--color-muted)",
        hover: "var(--color-hover)",
        "hover-strong": "var(--color-hover-strong)",
        // Semantic brand colors (static)
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
          muted: "#EFF6FF",
        },
        success: {
          DEFAULT: "#10B981",
          dark: "#059669",
          soft: "#D1FAE5",
          muted: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          soft: "#FEF3C7",
          muted: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#EF4444",
          dark: "#DC2626",
          soft: "#FEE2E2",
          muted: "#FEF2F2",
        },
        // Static hover
        hover: "var(--color-hover)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        // Glass card glow
        brand: "0 0 0 3px rgba(37,99,235,0.15)",
        success: "0 0 0 3px rgba(16,185,129,0.15)",
        danger: "0 0 0 3px rgba(239,68,68,0.15)",
      },
      borderRadius: {
        card: "16px",
        btn: "10px",
        input: "10px",
        badge: "6px",
        pill: "9999px",
      },
      fontSize: {
        "page-title": ["32px", { lineHeight: "1.2", fontWeight: "800", letterSpacing: "-0.02em" }],
        "section-title": ["20px", { lineHeight: "1.3", fontWeight: "700", letterSpacing: "-0.01em" }],
        "card-title": ["15px", { lineHeight: "1.4", fontWeight: "700" }],
        "body": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        "micro": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.04em" }],
      },
      spacing: {
        "4.5": "18px",
        "18": "72px",
        "22": "88px",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out both",
        "slide-up": "slideUp 250ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
