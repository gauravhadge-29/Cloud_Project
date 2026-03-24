/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        accent: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        surface: {
          DEFAULT: "rgb(255 255 255 / 0.7)",
          strong: "rgb(255 255 255 / 0.92)",
        },
        dark: {
          bg:      "#080d14",
          surface: "#0d1520",
          card:    "#111827",
          border:  "#1e2d3d",
          hover:   "#172333",
        },
      },
      boxShadow: {
        soft:  "0 4px 24px -4px rgba(6,182,212,0.08), 0 1px 6px rgba(0,0,0,0.06)",
        lift:  "0 12px 40px -8px rgba(6,182,212,0.18), 0 4px 16px rgba(0,0,0,0.12)",
        glow:  "0 0 20px rgba(6,182,212,0.25)",
        "glow-green": "0 0 20px rgba(16,185,129,0.25)",
        "glow-red":   "0 0 20px rgba(239,68,68,0.25)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.25)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
        "gradient-dark":    "linear-gradient(135deg, #0d1520 0%, #080d14 100%)",
        "gradient-card":    "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
        "gradient-danger":  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        "gradient-warning": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "gradient-info":    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        "noise":            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      borderRadius: {
        "4xl": "2rem",
        xl: "18px",
      },
      animation: {
        "fade-in":       "fadeIn 0.35s ease forwards",
        "slide-up":      "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in-right":"slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-slow":    "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":     "spin 3s linear infinite",
        "bounce-soft":   "bounceSoft 1.2s ease infinite",
        "shimmer":       "shimmer 1.8s linear infinite",
        "glow-pulse":    "glowPulse 2s ease-in-out infinite",
        "count-up":      "countUp 0.6s ease forwards",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(6,182,212,0.3)" },
          "50%":      { boxShadow: "0 0 24px rgba(6,182,212,0.7)" },
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
