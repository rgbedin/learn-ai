import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      transitionProperty: {
        width: "width",
      },
      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.33)",
      },
    },
  },
  plugins: [require("daisyui")],
  darkMode: "class",
} satisfies Config;
