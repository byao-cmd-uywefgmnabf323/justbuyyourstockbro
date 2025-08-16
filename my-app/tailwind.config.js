/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#111827", // gray-900 as accent (black-ish)
          foreground: "#ffffff",
        },
        charcoal: {
          DEFAULT: "#0b0f13",
        },
        background: "#ffffff",
        foreground: "#111827",
        muted: "#6b7280",
        border: "#e5e7eb",
      },
      boxShadow: {
        card: "0 6px 24px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      maxWidth: {
        'laptop': '1200px',
        'screen-2xl': '1440px',
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
