<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <form @submit.prevent="handleSave">
                <h4 class="text-md ml-2">Annotation API</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-account-field">Account:</label>
                        <input
                            id="annot-account-field"
                            v-model="rawAnnotAPIAcct"
                            type="text"
                            placeholder="name"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-key-field">API Key:</label>
                        <input
                            id="annot-key-field"
                            v-model="rawAnnotAPIKey"
                            type="text"
                            placeholder="Add a new key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <div class="ml-2 mt-10">
                    <button type="submit" class="btn btn-primary text-sm self-start">
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
    import { useKeyStore } from "@/store/key";
    import { storeToRefs } from "pinia";
    import { useIndexedDB } from "@/utils/indexedDB";

    export default {
        components: {
            MenuBar,
        },
        setup() {
            const nostrStore = useNostrStore();
            const keyStore = useKeyStore();
            const { user } = storeToRefs(nostrStore);
            const { encryptionKey } = storeToRefs(keyStore);
            let rawAnnotAPIAcct = ref("");
            let rawAnnotAPIKey = ref("");
            let annotAPIKeyExists = ref(false);

            // TODO: remove key after testing
            keyStore.setEncryptionKey("");

            async function initData() {
                try {
                    const userData = await useIndexedDB().get(user.value.npub);
                    if (!userData) {
                        console.log("No user data found in IndexedDB");
                        return;
                    } else {
                        try {
                            if (!encryptionKey.value) {
                                console.log("Encryption key is required to decrypt user data.");
                                return;
                            }
                            rawAnnotAPIAcct.value = nip44?.v2?.decrypt(
                                userData.encryptedAnnotAPIAcct,
                                encryptionKey.value
                            );
                            rawAnnotAPIKey.value = nip44?.v2?.decrypt(
                                userData.encryptedAnnotAPIKey,
                                encryptionKey.value
                            );

                            if (rawAnnotAPIKey.value) {
                                annotAPIKeyExists.value = true;
                            }
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

                const encryptionKey = getPublicKey(privateKey);
                let encryptedAnnotAPIAcct = "";
                let encryptedAnnotAPIKey = "";

                try {
                    // Encrypt the event using NIP-44
                    encryptedAnnotAPIAcct = nip44?.v2?.encrypt(rawAnnotAPIAcct.value, encryptionKey);
                    encryptedAnnotAPIKey = nip44?.v2?.encrypt(rawAnnotAPIKey.value, encryptionKey);
                } catch (error) {
                    console.error("Error: Failed to encrypt event content: ", error.message);
                }

                if (!encryptedAnnotAPIAcct || !encryptedAnnotAPIKey) {
                    console.error("Failed to encrypt settings");
                    return;
                } else {
                    try {
                        await useIndexedDB().set(user.value.npub, {
                            encryptedAnnotAPIAcct: encryptedAnnotAPIAcct,
                            encryptedAnnotAPIKey: encryptedAnnotAPIKey,
                        });
                    } catch (error) {
                        console.error("Failed to save secrets to IndexedDB", error);
                    }
                }
            };

            return {
                rawAnnotAPIAcct,
                rawAnnotAPIKey,
                annotAPIKeyExists,
                handleSave,
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
