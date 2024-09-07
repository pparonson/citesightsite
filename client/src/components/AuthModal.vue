<template>
    <teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
            id="authModal"
        >
            <div
                class="relative mx-auto mt-20 w-full max-w-lg h-96 shadow-lg rounded-sm bg-white"
            >
                <div class="mt-3 text-center">
                    <div class="mt-10 flex flex-col items-center">
                        <button
                            class="btn btn-primary w-60 text-white hover:bg-purple-500 font-bold py-2 px-2 mx-2 mt-20"
                            @click="login('nostr-login')"
                        >LOGIN
                        </button>
                        <p class="mt-20">Only NIP-07 and NIP-46 logins are supported.</p>
                        <p>Do not paste nsec key.</p>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script>
import { computed, defineComponent } from "vue";
import { useAuthStore } from "@/store/auth";
import { useNostrStore } from "@/store/nostr";

export default defineComponent({
    name: "AuthModal",
    props: {
        show: {
            type: Boolean,
            required: true,
        },
    },
    setup() {
        const authStore = useAuthStore();
        const nostrStore = useNostrStore();

        const login = async (method) => {
            authStore.setLoginMethod(method);

            try {
                await nostrStore.initializeNDK();
            } catch (error) {
                console.error(`Failed to initialize NDK: ${error}`);
            }
        };

        return {
            login,
        };
    },
});
</script>
