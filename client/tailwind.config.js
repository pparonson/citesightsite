import daisyui from "daisyui";

export default {
    content: ["./src/**/*.{vue,js,ts}"],
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                mytheme: {
                    primary: "#f7931a",
                    secondary: "#3b39e5",
                    accent: "#37cdbe",
                    neutral: "#3d4451",
                    "base-100": "#ffffff",
                },
            },
            "lofi",
            "light",
            "dark",
        ],
    },
};
