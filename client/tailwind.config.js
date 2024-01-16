import daisyui from "daisyui";

export default {
    content: ["./src/**/*.{vue,js,ts}"],
    theme: {
        extend: {},
        daisyui: {
            themes: ["dark"],
        },
    },
    plugins: [daisyui],
};
