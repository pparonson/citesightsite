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
                    <h3
                        class="pt-10 text-lg leading-6 font-medium text-gray-900"
                    >
                        Login
                    </h3>
                    <div class="mt-10 flex flex-col items-center">
                        <button
                            class="btn btn-primary w-60 text-white hover:bg-purple-500 font-bold py-2 px-2 mx-2"
                            :class="{ 'bg-gray-400 cursor-not-allowed': true }"
                            disabled
                            @click="login('NIP46')"
                        >
                            NIP46 Login (nsecbunker)
                            <br />
                            (Coming soon)
                        </button>
                        <button
                            class="btn btn-primary w-60 text-white hover:bg-orange-500 font-bold py-2 px-4 mx-2 mt-10"
                            @click="login('NIP07')"
                        >
                            NIP07 Login (browser extension)
                        </button>
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
