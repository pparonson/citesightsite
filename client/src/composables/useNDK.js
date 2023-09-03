import { getCurrentInstance } from 'vue';

export default function useNDK() {
  const ndk = getCurrentInstance().appContext.config.globalProperties.ndk;
  
  if (!ndk) {
    throw new Error('NDK instance is not available');
  }

  return { ndk };
}

