<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <form @submit.prevent="handleSave">

                <h4 class="text-md ml-2">Encryption</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="account-field">Encryption Key (Hex Format):</label>
                        <input
                            id="encryptionKey-field"
                            v-model="annotAcct"
                            type="text"
                            placeholder="key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <h4 class="text-md ml-2 mt-6">Annotations API</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="account-field">Account:</label>
                        <input
                            id="account-field"
                            v-model="annotAcct"
                            type="text"
                            placeholder="name"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="secret-field">API Key:</label>
                        <input
                            id="secret-field"
                            v-model="annotAPIKey"
                            type="text"
                            placeholder="key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <h4 class="text-md ml-2 mt-6">AI Model API</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="account-field">Account:</label>
                        <input
                            id="account-field"
                            v-model="annotAcct"
                            type="text"
                            placeholder="name"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="secret-field">API Key:</label>
                        <input
                            id="secret-field"
                            v-model="annotAPIKey"
                            type="text"
                            placeholder="key"
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
    import { ref } from "vue";
    import MenuBar from "@/components/MenuBar.vue";
    import { useNostrStore } from "@/store/nostr";
    import { storeToRefs } from "pinia";
    import { deriveAESKey, encrypt, decrypt } from "../utils/crypto.js";
    import { useIndexedDB } from "@/utils/indexedDB";

    export default {
        components: {
            MenuBar,
        },
        setup() {
            const nostrStore = useNostrStore();
            const { user } = storeToRefs(nostrStore);
            const annotAcct = ref("");
            const annotAPIKey = ref("");

            const handleSave = async () => {
                if (!user.value?.npub) {
                    console.log("User npub is required to store user data.");
                    return;
                }

                const secret = "YourStaticSecretHere"; // Should be provided safely
                const salt = "YourStaticSaltHere"; // Should be provided safely
                const iv = "YourStaticIvHere"; // Should be provided safely

                const encryptedAnnotAccount = await encrypt(annotAcct.value);
                const encryptedAnnotAPIKey = await encrypt(annotAPIKey.value);

                try {
                    await useIndexedDB().set(user.value.npub, {
                        encryptedAnnotAccount: encryptedAnnotAccount.content,
                        encryptedAnnotAPIKey: encryptedAnnotAPIKey.content,
                    });
                } catch (error) {
                    console.error("Failed to save secrets to IndexedDB", error);
                }

                // await useIndexedDB().set(user.value.npub, {
                //     encryptedAnnotAccount: encryptedAnnotAccount.content,
                //     encryptedAnnotAPIKey: encryptedAnnotAPIKey.content
                // });
            };

            return {
                annotAcct, // TODO: can these be removed from return?
                annotAPIKey,
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
