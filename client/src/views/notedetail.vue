<template>
  <div class="p-4">
    <div class="mt-4 mb-4">
        <router-link to="/">
            <button class="btn btn-primary h-10">
                <font-awesome-icon :icon="['fas', 'angles-left']" />
            </button>
        </router-link>
    </div>
    <p class="mb-4">{{ noteEventDetail.content }}</p>
    <div class="flex flex-wrap">
        <span 
            v-for="tag in noteEventDetail.tags" 
            :key="tag" 
            class="bg-gray-200 px-2 py-1 text-sm text-gray-700 mr-2 rounded-md"> {{ tag }}
        </span>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import useNostrState from '@/composables/nostr';

export default {
  setup() {
    const router = useRouter();
    const { getNoteEventFromState, fetchNoteEventById, noteEventDetail } = useNostrState();
    const eventId = router.currentRoute.value.params.id;

    onMounted(async () => {
      // Phase 1: Get the event from Vuex state
      getNoteEventFromState(eventId);

      // Phase 2: Asynchronously update the event detail from NDK API
      try {
        await fetchNoteEventById(eventId);
      } catch (error) {
        console.error("Error fetching event detail:", error);
      }
    });

    return {
      noteEventDetail,
    };
  },
};
</script>
