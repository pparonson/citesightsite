import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import version from "./version.json";

export default defineConfig((mode) => {
    console.log("mode:", mode);
    console.log("version:", version);

    return {
        plugins: [vue()],
        server: {
            host: "0.0.0.0",
            port: 3000,
        },
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
    };
});
