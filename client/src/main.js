import { createApp } from 'vue';
import NDK from '@nostr-dev-kit/ndk';
import { library, config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faArrowLeft, faBars } from '@fortawesome/free-solid-svg-icons';
// import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
// import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import App from './App.vue'
import router from './router'
import './assets/main.css'

async function init() {
  const ndk = new NDK({
    explicitRelayUrls: ['wss://relay.nostr.band', 'wss://relay.damus.io', 'wss://purplepag.es']
  });

  try {
    await ndk.connect();
    console.log('NDK Connected..');
  } catch (error) {
    console.error('Error connecting to NDK:', error);
    throw error;
  }

  config.autoAddCss = false
  library.add(faArrowLeft, faBars);

  const app = createApp(App);
  app.config.globalProperties.ndk = ndk;
  app.component('font-awesome-icon', FontAwesomeIcon);
  app.use(router);
  app.mount('#app');
}

init();

