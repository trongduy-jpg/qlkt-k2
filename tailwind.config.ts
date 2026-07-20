import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bang mau don sac am (nau - kem) theo giao dien mau
        ink: "#1a1714",
        jade: "#4a443b",
        brass: "#9a7b3f",
        paper: "#efe9e2",
        line: "#e0dacd",
        // Ghi de thang mau zinc -> nau xam am de chu mo hoa am ap hon
        zinc: {
          50: "#f5f2ec",
          100: "#ebe6dd",
          200: "#ddd6c9",
          300: "#c9c0b0",
          400: "#9c9690",
          500: "#837c73",
          600: "#6b6560",
          700: "#55504a",
          800: "#3d3934",
          900: "#1a1714"
        },
        // Ghi de emerald -> tong kem/nau trung tinh (mau mau khong dung xanh)
        emerald: {
          50: "#efe9e2",
          100: "#e6ded2",
          200: "#d8cfbf",
          300: "#c4b8a2",
          400: "#a1917a",
          500: "#7d7060",
          600: "#5f574a",
          700: "#4a443b",
          800: "#3a352d",
          900: "#2a2620"
        }
      }
    }
  },
  plugins: []
};

export default config;
