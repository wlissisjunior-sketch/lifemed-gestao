/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1E33",
          800: "#152841",
          700: "#1C334F",
        },
        paper: "#F5F6F3",
        surface: "#FFFFFF",
        sage: {
          DEFAULT: "#1F7A5C",
          50: "#EAF4F0",
          100: "#D3E9E1",
          600: "#1B6B50",
          700: "#155943",
        },
        amber: {
          DEFAULT: "#B9781F",
          50: "#FBF1E1",
        },
        coral: {
          DEFAULT: "#B3402E",
          50: "#FBEAE7",
        },
        slate: {
          900: "#212B38",
          700: "#3A4453",
          500: "#64707F",
          300: "#A6AEB8",
          200: "#E4E7E2",
          100: "#EEEFEB",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,30,51,0.04), 0 1px 8px rgba(14,30,51,0.04)",
        pop: "0 8px 24px rgba(14,30,51,0.12)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
}

