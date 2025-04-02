
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#DC143C",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#383B39",
          foreground: "#FFFFFF",
        },
        iris: {
          DEFAULT: "#4B4DED",
          light: "#EFEFFD",
        },
        dark: "#0E0E2C",
        success: "#21CA6F",
        accent: {
          DEFAULT: "#ECF1F4",
          foreground: "#222020",
        },
        body: "#222020",
        subtitle: "#6A6A77",
        sidebar: {
          DEFAULT: "var(--sidebar-bg, #FFFFFF)",
          foreground: "var(--sidebar-fg, #222020)",
          border: "var(--sidebar-border, #E0E0E0)",
          ring: "var(--sidebar-ring, #0E0E2C)",
          accent: "var(--sidebar-accent, #ECF1F4)",
          "accent-foreground": "var(--sidebar-accent-fg, #222020)",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
