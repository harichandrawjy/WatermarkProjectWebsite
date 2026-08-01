/** @type {import('tailwindcss').Config} */

/* Aegis design tokens.
 *
 * Everything visual in the app should come from here. If you find yourself
 * reaching for a raw hex or an arbitrary `text-[13.5px]`, the token is either
 * missing or you're reinventing one that exists.
 *
 * Colour roles, not colour names:
 *   canvas / surface  — the page and the things sitting on it
 *   line              — hairline separators
 *   ink               — text, in four descending weights of attention
 *   accent            — brand + "encode" path
 *   alert / ok / warn — verdict states. NEVER decorative; these mean something.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },

      colors: {
        canvas: "#08090b",
        surface: {
          DEFAULT: "#101217", // cards, panels
          raised: "#171a21", // header rows, table heads, hover
          inset: "#0b0c10", // inputs, media wells — recessed below the card
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)",
        },
        ink: {
          hi: "#eef1f6", // headings, values
          DEFAULT: "#b9c0cc", // body
          lo: "#79808f", // captions, labels
          faint: "#525863", // placeholders, disabled
        },
        accent: {
          DEFAULT: "#22d3ee",
          hover: "#67e8f9",
          ink: "#04222b", // text sitting ON accent
          soft: "rgba(34,211,238,0.09)",
          line: "rgba(34,211,238,0.26)",
        },
        alert: {
          DEFAULT: "#f43f5e",
          hover: "#fb7185",
          soft: "rgba(244,63,94,0.09)",
          line: "rgba(244,63,94,0.26)",
        },
        ok: {
          DEFAULT: "#34d399",
          soft: "rgba(52,211,153,0.09)",
          line: "rgba(52,211,153,0.26)",
        },
        warn: {
          DEFAULT: "#fbbf24",
          soft: "rgba(251,191,36,0.09)",
          line: "rgba(251,191,36,0.26)",
        },
      },

      /* One scale. Eleven steps. If a size isn't here, it isn't needed. */
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }], //  11 — labels, eyebrows
        xs: ["0.75rem", { lineHeight: "1.125rem" }], //  12 — captions, meta
        sm: ["0.8125rem", { lineHeight: "1.3rem" }], //  13 — dense body
        base: ["0.875rem", { lineHeight: "1.5rem" }], //  14 — body, controls
        md: ["0.9375rem", { lineHeight: "1.55rem" }], //  15 — lead body
        lg: ["1.0625rem", { lineHeight: "1.6rem" }], //  17 — card titles
        xl: ["1.25rem", { lineHeight: "1.45" }], //  20 — section titles
        "2xl": ["1.5rem", { lineHeight: "1.35" }], //  24
        "3xl": ["1.875rem", { lineHeight: "1.25" }], //  30 — page titles (sm)
        "4xl": ["2.375rem", { lineHeight: "1.18", letterSpacing: "-0.015em" }], //  38
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }], //  48 — hero
      },

      /* Three radii. lg = controls, xl = buttons/inputs, 2xl = cards.
       * Anything rounder reads as a toy, which is wrong for a forensics tool. */
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },

      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -14px rgba(0,0,0,0.9)",
        lift: "0 2px 6px rgba(0,0,0,0.45), 0 20px 44px -20px rgba(0,0,0,1)",
        /* Glows are reserved for state that MEANS something — a verdict, a
         * live scan, the focused control. Never decoration. */
        "glow-accent": "0 0 24px -6px rgba(34,211,238,0.45)",
        "glow-alert": "0 0 24px -6px rgba(244,63,94,0.45)",
        "glow-ok": "0 0 24px -6px rgba(52,211,153,0.45)",
      },

      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 0.35s ease both",
        "spin-slow": "spin 1.6s linear infinite",
        indeterminate: "indeterminate 1.4s cubic-bezier(0.65,0,0.35,1) infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
      },
    },
  },
  plugins: [],
};
