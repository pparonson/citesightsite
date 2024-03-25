import { defineStore } from "pinia";
import { getPublicKey } from "nostr-tools";

export const useKeyStore = defineStore("key", {
    state: () => {
        return {
            encryptionKey: null,
        };
    },
    actions: {
        setEncryptionKey(pk) {
            try {
                this.encryptionKey = getPublicKey(pk);
            } catch (error) {
                console.error("Error: failed to setEncryptionKey", error);
            }
        },
    },
});
