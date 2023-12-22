import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     vue(),
//   ],
//   server: {
//     host: '0.0.0.0',
//     port: 3000
//   },
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url))
//     }
//   }
// })

export default defineConfig((mode) => {
    // Load environment variables
    // const env = loadEnv(mode, process.cwd());

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
