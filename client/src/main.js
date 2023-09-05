import { createApp } from 'vue';
// import NDK from '@nostr-dev-kit/ndk';
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import { library, config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faAnglesLeft, faBars, faPlus } from '@fortawesome/free-solid-svg-icons';
import App from './App.vue'
import router from './router'
import './assets/main.css'

async function init() {
  const nip07signer = new NDKNip07Signer();
  const ndk = new NDK({
    signer: nip07signer,
    explicitRelayUrls: ['wss://relay.nostr.band', 'wss://relay.damus.io', 'wss://purplepag.es']
  });

  let user;

  try {
    await ndk.connect();
    console.log('NDK Connected..');

    user = await nip07signer.user();
    if (user?.npub) {
        console.log("Permission granted to read their public key:", user.npub);
    }
  } catch (error) {
    console.error('Error connecting to NDK:', error);
    throw error;
  }

  config.autoAddCss = false // this setting provides more control the imported css
  library.add(faAnglesLeft, faBars, faPlus);

  const app = createApp(App);
  app.config.globalProperties.ndk = ndk;
  app.config.globalProperties.user = user;
  app.component('font-awesome-icon', FontAwesomeIcon);
  app.use(router);
  app.mount('#app');
}

init();

