import { createApp } from "vue";
import { createPinia } from "pinia";
import { library, config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
    faAnglesLeft,
    faGear,
    faPen,
    faXmark,
    faCalendarDay,
    faSquarePlus,
    faSpinner,
    faTags,
} from "@fortawesome/free-solid-svg-icons";
import { init as initNostrLogin } from "nostr-login";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useAuthStore } from "@/store/auth";
import { useNostrStore } from "@/store/nostr";

async function init() {
    config.autoAddCss = false; // this setting provides more control the imported css
    library.add(faAnglesLeft, faGear, faPen, faXmark, faCalendarDay, faSquarePlus, faSpinner, faTags);

    const app = createApp(App);
    const pinia = createPinia();

    app.component("font-awesome-icon", FontAwesomeIcon);
    app.use(router);
    app.use(pinia);

    // Initialize stores after pinia is set up
    const authStore = useAuthStore();
    const nostrStore = useNostrStore();

    // Set up nlAuth event listener for nostr-login auth state changes
    document.addEventListener('nlAuth', async (e) => {
        const { type } = e.detail;
        if (type === 'login' || type === 'signup') {
            authStore.setLoginMethod('nostr-login');
            
            // Initialize NDK with the authenticated user
            // skipLaunch=true because user is already authenticated via nostr-login
            try {
                await nostrStore.initializeNDK(true);
            } catch (error) {
                console.error('Failed to initialize NDK after auth:', error);
            }
        } else if (type === 'logout') {
            authStore.setLoginStatus(false);
            authStore.setUserNpub(null);
        }
    });

    // Initialize nostr-login early, before any window.nostr calls
    // This sets up window.nostr and the login UI
    // Auth flow will auto-launch on first window.nostr call if user isn't authed
    try {
        await initNostrLogin({
            bunkers: 'nsec.app',
            theme: 'ocean',
            darkMode: true,
            perms: 'sign_event:1,sign_event:30023,sign_event:30024,nip44_encrypt,nip44_decrypt',
            noBanner: true,
            startScreen: 'login-bunker-url', // Default screen when auth flow launches
        });
    } catch (error) {
        console.error('Failed to initialize Nostr Login:', error);
    }

    app.mount("#app");
}

init();
