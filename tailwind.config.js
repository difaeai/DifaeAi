const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-pt-sans)", "sans-serif"],
        headline: ["var(--font-space-grotesk)", "sans-serif"],
        code: ["var(--font-source-code-pro)", "monospace"],
      },

      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "tw-enter": {
          from: {
            opacity: "var(--tw-enter-opacity)",
            transform:
              "translate3d(var(--tw-enter-translate-x), var(--tw-enter-translate-y), 0) scale3d(var(--tw-enter-scale), var(--tw-enter-scale), var(--tw-enter-scale))",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          },
        },
        "tw-exit": {
          from: {
            opacity: "1",
            transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          },
          to: {
            opacity: "var(--tw-exit-opacity)",
            transform:
              "translate3d(var(--tw-exit-translate-x), var(--tw-exit-translate-y), 0) scale3d(var(--tw-exit-scale), var(--tw-exit-scale), var(--tw-exit-scale))",
          },
        },
        "pulse-subtle": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: ".8" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "tw-in": "tw-enter var(--tw-enter-duration) var(--tw-enter-easing) both",
        "tw-out": "tw-exit var(--tw-exit-duration) var(--tw-exit-easing) both",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },

  plugins: [
    plugin(function ({ addBase, addUtilities, theme }) {
      addBase({
        ":root": {
          "--tw-enter-duration": "150ms",
          "--tw-exit-duration": "150ms",
          "--tw-enter-easing": "cubic-bezier(0.16, 1, 0.3, 1)",
          "--tw-exit-easing": "cubic-bezier(0.7, 0, 0.84, 0)",
          "--tw-enter-opacity": "1",
          "--tw-exit-opacity": "1",
          "--tw-enter-scale": "1",
          "--tw-exit-scale": "1",
          "--tw-enter-translate-x": "0",
          "--tw-enter-translate-y": "0",
          "--tw-exit-translate-x": "0",
          "--tw-exit-translate-y": "0",
        },
      });

      addUtilities({
        ".animate-in": { animation: theme("animation.tw-in") },
        ".animate-out": { animation: theme("animation.tw-out") },
        ".fade-in": { "--tw-enter-opacity": "0" },
        ".fade-in-0": { "--tw-enter-opacity": "0" },
        ".fade-out-0": { "--tw-exit-opacity": "0" },
        ".fade-out-80": { "--tw-exit-opacity": "0" },
        ".zoom-in-95": { "--tw-enter-scale": "0.95" },
        ".zoom-out-95": { "--tw-exit-scale": "0.95" },
        ".slide-in-from-top": { "--tw-enter-translate-y": "-100%" },
        ".slide-in-from-bottom": { "--tw-enter-translate-y": "100%" },
        ".slide-in-from-left": { "--tw-enter-translate-x": "-100%" },
        ".slide-in-from-right": { "--tw-enter-translate-x": "100%" },
        ".slide-in-from-top-2": { "--tw-enter-translate-y": "-0.5rem" },
        ".slide-in-from-bottom-2": { "--tw-enter-translate-y": "0.5rem" },
        ".slide-in-from-left-2": { "--tw-enter-translate-x": "-0.5rem" },
        ".slide-in-from-right-2": { "--tw-enter-translate-x": "0.5rem" },
        ".slide-in-from-top-full": { "--tw-enter-translate-y": "-100%" },
        ".slide-in-from-bottom-full": { "--tw-enter-translate-y": "100%" },
        ".slide-out-to-top": { "--tw-exit-translate-y": "-100%" },
        ".slide-out-to-bottom": { "--tw-exit-translate-y": "100%" },
        ".slide-out-to-left": { "--tw-exit-translate-x": "-100%" },
        ".slide-out-to-right": { "--tw-exit-translate-x": "100%" },
        ".slide-out-to-right-full": { "--tw-exit-translate-x": "100%" },
      });
    }),
  ],
};
