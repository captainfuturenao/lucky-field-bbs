import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'lucky-green': '#4ade80',
                'lucky-pink': '#f472b6',
                'lucky-yellow': '#facc15',
            },
            fontFamily: {
                sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
