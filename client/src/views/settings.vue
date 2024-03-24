<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <form @submit.prevent="handleSave">
                <h4 class="text-md ml-2">Encryption</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="encryption-key-field">Encryption Key (Hex Format):</label>
                        <input
                            id="encryption-key-field"
                            v-model="encryptionKey"
                            type="text"
                            placeholder="key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <h4 class="text-md ml-2 mt-6">Annotations API</h4>
                <div class="flex flex-col">
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-account-field">Account:</label>
                        <input
                            id="annot-account-field"
                            v-model="annotAPIAcct"
                            type="text"
                            placeholder="name"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                    <div class="flex items-center mt-1 ml-6">
                        <label class="w-1/6" for="annot-key-field">API Key:</label>
                        <input
                            id="annot-key-field"
                            v-model="annotAPIKey"
                            type="text"
                            placeholder="key"
                            class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8"
                        />
                    </div>
                </div>

                <!-- <h4 v-if="false" class="text-md ml-2 mt-6">AI Model API</h4> -->
                <!-- <div v-if="false"  class="flex flex-col"> -->
                <!--     <div class="flex items-center mt-1 ml-6"> -->
                <!--         <label class="w-1/6" for="ai-account-field">Account:</label> -->
                <!--         <input -->
                <!--             id="ai-account-field" -->
                <!--             v-model="aIAPIAcct" -->
                <!--             type="text" -->
                <!--             placeholder="name" -->
                <!--             class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8" -->
                <!--         /> -->
                <!--     </div> -->
                <!--     <div class="flex items-center mt-1 ml-6"> -->
                <!--         <label class="w-1/6" for="ai-key-field">API Key:</label> -->
                <!--         <input -->
                <!--             id="ai-key-field" -->
                <!--             v-model="aIAPIKey" -->
                <!--             type="text" -->
                <!--             placeholder="key" -->
                <!--             class="w-1/4 ml-2 p-2 border border-gray-300 rounded text-sm h-8" -->
                <!--         /> -->
                <!--     </div> -->
                <!-- </div> -->

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
    import { storeToRefs } from "pinia";
    import { useIndexedDB } from "@/utils/indexedDB";

    export default {
        components: {
            MenuBar,
        },
        setup() {
            const nostrStore = useNostrStore();
            const { user } = storeToRefs(nostrStore);
            const rawEncryptionKey = ref("");
            const rawAnnotAPIAcct = ref("");
            const rawAnnotAPIKey = ref("");
            const privateKey = "";  // TODO: remove after testing

            async function initData() {
                try {
                    const userData = await useIndexedDB().get(user.value.npub);
                    if (!userData) {
                        console.log("No user data found in IndexedDB");
                        return;
                    } else {
                        try {
                            rawAnnotAPIAcct.value = await decrypt(userSettings.encryptedAnnotAccount, privateKey);
                            rawAnnotAPIKey.value = await decrypt(userSettings.encryptedAnnotAPIKey, privateKey);
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

                const encryptedAnnotAPIAccount = await encrypt(annotAcct.value, privateKey);
                const encryptedAnnotAPIKey = await encrypt(annotAPIKey.value, privateKey);

                try {
                    await useIndexedDB().set(user.value.npub, {
                        encryptedAnnotAPIAccount: annotAPIAcct.value,
                        encryptedAnnotAPIKey: annotAPIKey.value,
                    });
                } catch (error) {
                    console.error("Failed to save secrets to IndexedDB", error);
                }
            };

            return {
                rawEncryptionKey,
                rawAnnotAPIAcct,
                rawAnnotAPIKey,
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
