import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library, config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faAnglesLeft, faBars, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNostrStore } from '@/store/nostr';
import App from './App.vue'
import router from './router'
import './assets/main.css'

async function init() {
  config.autoAddCss = false // this setting provides more control the imported css
  library.add(faAnglesLeft, faBars, faPlus);


  const app = createApp(App);
  const pinia = createPinia();
    
  app.component('font-awesome-icon', FontAwesomeIcon);
  app.use(router);
  app.use(pinia);


  const nostrStore = useNostrStore();

  try {
      await nostrStore.initializeNDK();
      console.log('Pinia store:', pinia.state.value);
  } catch (error) {
    console.error(`Failed to initialize NDK: ${error}`);
    throw error;
  }

  app.mount('#app');
}

init();

