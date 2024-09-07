<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <div v-if="hasSettingsSaved" class="alert alert-success shadow-lg mb-4">
                <span>Settings successfully updated!</span>
            </div>
            <div v-if="hasSettingsSaved === 'false'" class="alert alert-error shadow-lg mb-4">
                <span>Failed to update settings!</span>
            </div>
        
            <form @submit.prevent="handleSave">
                <h4 class="text-md ml-2">Annotation API</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-account-field"
                            >Account:</label
                        >
                        <input
                            id="annot-account-field"
                            v-model="rawAnnotAPIAcct"
                            type="text"
                            placeholder="Account name"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-key-field"
                            >API Key:</label
                        >
                        <input
                            id="annot-key-field"
                            v-model="rawAnnotAPIKey"
                            type="text"
                            placeholder="Add a new key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <h4 class="text-md mt-6 ml-2">Encryption</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-account-field"
                            >Encryption Key:</label
                        >
                        <input
                            id="encryption-key-field"
                            v-model="rawEncryptionKey"
                            type="text"
                            placeholder="Add a new Key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <h4 class="text-md mt-6 ml-2">Nostr Settings</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="relay-urls-field"
                            >Relay URLs:</label
                        >
                        <textarea
                            id="relay-urls-field"
                            v-model="relayUrls"
                            placeholder="Enter relay URLs, separated by commas"
                            rows="4"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm"
                        />
                    </div>
                </div>

                <div class="ml-2 mt-10">
                    <button
                        type="submit"
                        class="btn btn-primary text-sm self-start"
                    >
                        Save <font-awesome-icon icon="pen" aria-label="save" />
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import { ref, computed } from "vue";
import MenuBar from "@/components/MenuBar.vue";
import { nip44 } from "nostr-tools";
import { useNostrStore } from "@/store/nostr";
import { storeToRefs } from "pinia";
import { useIndexedDB } from "@/utils/indexedDB";

export default {
    components: {
        MenuBar,
    },
    setup() {
        const nostrStore = useNostrStore();
        const { user } = storeToRefs(nostrStore);
        let rawAnnotAPIAcct = ref("");
        let rawAnnotAPIKey = ref("");
        let rawEncryptionKey = ref("");
        let relayUrls = ref("");
        let hasSettingsSaved = ref("");

        // TODO: remove key after testing
        // keyStore.setEncryptionKey("");

        async function initData() {
            try {
                const userData = await useIndexedDB().get(user.value.npub);
                if (!userData) {
                    console.log("No user data found in IndexedDB");
                    return;
                } else {
                    try {
                        // retain this commented-out code for testing
                        // if (!encryptionKey.value) {
                        //     console.log("Encryption key is required to decrypt user data.");
                        //     return;
                        // }
                        // rawAnnotAPIAcct.value = nip44?.v2?.decrypt(
                        //     userData.encryptedAnnotAPIAcct,
                        //     encryptionKey.value
                        // );
                        // rawAnnotAPIKey.value = nip44?.v2?.decrypt(
                        //     userData.encryptedAnnotAPIKey,
                        //     encryptionKey.value
                        // );
                        rawAnnotAPIAcct.value = userData.encryptedAnnotAPIAcct;
                        rawAnnotAPIKey.value = userData.encryptedAnnotAPIKey;
                        rawEncryptionKey.value = userData.encryptionKey;
                        relayUrls.value = userData.relayUrls
                            ? userData.relayUrls.join(", ")
                            : "";
                    } catch (error) {
                        console.error("Failed to decrypt settings", error);
                    }
                }
            } catch (error) {
                console.error("Failed to get and decrypt settings", error);
            }
        }

        initData();

        const handleSave = async () => {
            if (!user.value?.npub) {
                console.log("User npub is required to store user data.");
                return;
            }

            // const encryptionKey = getPublicKey(encryptionKey);
            let encryptedAnnotAPIAcct = rawAnnotAPIAcct.value || "";
            let encryptedAnnotAPIKey = rawAnnotAPIKey.value || "";
            let encryptionKey = rawEncryptionKey.value || "";

            // retain this commented-out code for testing
            // try {
            //     // Encrypt the event using NIP-44
            //     encryptedAnnotAPIAcct = nip44?.v2?.encrypt(rawAnnotAPIAcct.value, encryptionKey);
            //     encryptedAnnotAPIKey = nip44?.v2?.encrypt(rawAnnotAPIKey.value, encryptionKey);
            // } catch (error) {
            //     console.error("Error: Failed to encrypt event content: ", error.message);
            // }

            if (!encryptedAnnotAPIAcct || !encryptedAnnotAPIKey) {
                console.error("Failed to encrypt settings");
                return;
            }

            const relayUrlsArray = relayUrls.value
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url.length > 0);

            try {
                await useIndexedDB().set(user.value.npub, {
                    encryptedAnnotAPIAcct: encryptedAnnotAPIAcct,
                    encryptedAnnotAPIKey: encryptedAnnotAPIKey,
                    encryptionKey: encryptionKey,
                    relayUrls: relayUrlsArray,
                });
                hasSettingsSaved.value = true;
                setTimeout(() => {
                    hasSettingsSaved.value = "";
                    // window.location.reload();
                }, 3000);
            } catch (error) {
                console.error("Failed to save settings to IndexedDB", error);
                hasSettingsSaved.value = false;
                setTimeout(() => {
                    hasSettingsSaved.value = "";
                }, 3000);
            }
        };

        return {
            rawAnnotAPIAcct,
            rawAnnotAPIKey,
            rawEncryptionKey,
            relayUrls,
            handleSave,
            hasSettingsSaved,
        };
    },
};
</script>
<style scoped>
.btn {
    @apply h-8;
    @apply min-h-[2rem];
}
</style>
