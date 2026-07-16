import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        jade: "#0f766e",
        brass: "#b7791f",
        paper: "#f7f5ef",
        line: "#ded8ca"
      }
    }
  },
  plugins: []
};

export default config;
