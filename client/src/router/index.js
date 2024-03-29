import { createRouter, createWebHistory } from "vue-router";
import Index from "@/views/index.vue";
import Settings from "@/views/settings.vue";
import NoteDetail from "@/views/notedetail.vue";
import config from "../../config/config.js";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Index,
    },
    {
        path: "/settings",
        name: "Settings",
        component: Settings,
    },
    {
        path: "/note/:id",
        name: "NoteDetail",
        component: NoteDetail,
        props: true,
    },
];

const { viteBaseUrl } = config.connections;
const router = createRouter({
    // history: createWebHistory(import.meta.env.VITE_BASE_URL || "/"),
    history: createWebHistory(viteBaseUrl),
    routes,
});

export default router;
