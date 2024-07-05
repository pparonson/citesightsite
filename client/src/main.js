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
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

async function init() {
    config.autoAddCss = false; // this setting provides more control the imported css
    library.add(faAnglesLeft, faGear, faPen, faXmark, faCalendarDay, faSquarePlus, faSpinner, faTags);

    const app = createApp(App);
    const pinia = createPinia();

    app.component("font-awesome-icon", FontAwesomeIcon);
    app.use(router);
    app.use(pinia);

    app.mount("#app");
}

init();
