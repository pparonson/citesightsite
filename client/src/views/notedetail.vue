<template>
    <div class="h-full px-2">
        <div class="mt-4 mb-1">
            <router-link to="/" class="text-xl ml-2">
                <font-awesome-icon icon="angles-left" aria-label="back" />
            </router-link>
        </div>
        <div>
            <teleport to="body">
                <div v-if="isPublishingEvent" class="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full" id="spinnerModal">
                    <div class="relative mx-auto mt-20 w-full max-w-lg h-96">
                        <div class="mt-3 text-center">
                            <span v-if="isPublishingEvent" class="loading loading-spinner loading-lg"></span>
                            <p>Saving...</p>
                        </div>
                    </div>
                </div>
            </teleport>
            <NoteEventDetail :id="eventId" />
        </div>
    </div>
</template>

<script>
    import { useAuthStore } from "@/store/auth";
    import { useNostrStore } from "@/store/nostr";
    import { storeToRefs } from "pinia";
    import { computed } from "vue";
    import { useRouter } from "vue-router";
    import NoteEventDetail from "@/components/NoteEventDetail.vue";

    export default {
        components: {
            NoteEventDetail,
        },
        setup() {
            const authStore = useAuthStore();
            const { isLoggedIn } = storeToRefs(authStore);
            const nostrStore = useNostrStore();
            const { isPublishingEvent } = storeToRefs(nostrStore);
            const router = useRouter();
            const eventId = computed(() => {
                const currentRoute = router.currentRoute.value;
                const params = currentRoute.params;
                const id = params.id;
                return id === "new" ? null : id;
            });

            return {
                eventId,
                isPublishingEvent
            };
        },
    };
</script>
