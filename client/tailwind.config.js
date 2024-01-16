import daisyui from "daisyui";

export default {
    content: ["./src/**/*.{vue,js,ts}"],
    theme: {
        extend: {},
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
                "light",
                "dark",
                "fantasy",
            ],
        },
    },
    plugins: [daisyui],
};
