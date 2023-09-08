<template>
  <div class="px-4">
    <div class="mt-2 mb-2">
        <router-link to="/">
            <button class="btn btn-primary h-10 mx-2">
                <font-awesome-icon :icon="['fas', 'angles-left']" />
            </button>
        </router-link>
    </div>
    <div><NoteEventDetail :initialNote="existingNote" /></div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNostrStore } from '@/store/nostr';
import NoteEventDetail from '@/components/NoteEventDetail.vue';

export default {
  components: {
    NoteEventDetail
  },
  setup() {
    const router = useRouter();
    const { getNoteEventFromState, fetchNoteEventById, note } = useNostrStore();
    const eventId = router.currentRoute?.value?.params?.id;

    onMounted(async () => {
      // Phase 1: Get the event from store
      getNoteEventFromState(eventId);

      // Phase 2: Asynchronously update the event detail from NDK API
      try {
        await fetchNoteEventById(eventId);
      } catch (error) {
        console.error("Error fetching event detail:", error);
      }
    });

    return {
      existingNote: note,
    };
  },
};
</script>
