import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        "surface-2": "#1a1a1a",
        border: "#222222",
        "border-subtle": "#1a1a1a",
        accent: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          muted: "rgba(37, 99, 235, 0.15)",
          glow: "rgba(37, 99, 235, 0.4)",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          muted: "#52525b",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.3), transparent)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        "blue-glow":
          "radial-gradient(circle at center, rgba(37,99,235,0.15) 0%, transparent 70%)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(37,99,235,0.2)",
        "glow-sm": "0 0 20px rgba(37,99,235,0.15)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
