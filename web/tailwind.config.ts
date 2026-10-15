import type { Config } from "tailwindcss";

// Palette for San Andreas Metro RP: near-black base, steel-blue
// trooper accent (patrol lightbar / uniform blue), cool steel-grey rule
// lines, and a badge-gold accent so gradients/highlights have a second
// stop - a highway-patrol/emergency-services mood instead of a nature one.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b0c09",
          50: "#f5f5f2",
          900: "#0b0c09",
          950: "#060704",
        },
        surface: {
          DEFAULT: "#15170f",
          raised: "#1c1f15",
        },
        line: "#2a2c1f",
        trooper: {
          DEFAULT: "#3b6ea5",
          300: "#9dc2e8",
          400: "#6ba0d6",
          500: "#3b6ea5",
          600: "#2f5788",
          700: "#24436a",
        },
        steel: {
          DEFAULT: "#c7d2e0",
          300: "#dbe3ee",
          600: "#96a7bd",
        },
        gold: {
          DEFAULT: "#c9a53b",
          300: "#e0c777",
          400: "#d3b654",
          500: "#c9a53b",
          600: "#a8842a",
        },
        bone: "#efece2",
        muted: "#9b9686",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at top, rgba(59,110,165,0.16), transparent 60%)",
        "hero-glow":
          "radial-gradient(circle at 20% 0%, rgba(59,110,165,0.22), transparent 55%), "
          + "radial-gradient(circle at 85% 15%, rgba(201,165,59,0.14), transparent 45%), "
          + "radial-gradient(circle at 50% 100%, rgba(178,58,58,0.1), transparent 50%)",
        "gradient-brand": "linear-gradient(90deg, #6ba0d6 0%, #c7d2e0 55%, #d3b654 100%)",
        "gradient-primary": "linear-gradient(135deg, #3b6ea5 0%, #2f5788 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,110,165,0.4), 0 8px 30px -8px rgba(59,110,165,0.55)",
        "glow-sm": "0 0 0 1px rgba(59,110,165,0.35), 0 4px 16px -6px rgba(59,110,165,0.5)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
