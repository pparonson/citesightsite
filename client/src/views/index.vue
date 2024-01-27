<template>
  <div class="flex h-screen">
      <div class="flex flex-col w-1/3 p-1 overflow-hidden">
        <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
        <div class="flex flex-1 overflow-y-auto overflow-x-hidden">
          <NoteEventList :noteEvents="filteredNoteEvents" />
        </div>
      </div>
      <div class="flex flex-col h-full w-2/3 overflow-y-auto overflow-x-hidden">
          <NoteEventDetailDisplay :noteEvent="note" />
      </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import NoteEventList from '@/components/NoteEventList.vue';
import NoteEventDetailDisplay from '@/components/NoteEventDetailDisplay.vue';
import { useNostrStore } from '@/store/nostr';
import { storeToRefs } from 'pinia';

export default {
  components: {
    MenuBar,
    NoteEventList,
    NoteEventDetailDisplay,
  },
  setup() {
    const nostrStore = useNostrStore();
    const { user, fetchEvents, subscribeToEvents, noteEvents } = storeToRefs(nostrStore);
    const searchTerm = ref('');
    
    const filterNotes = (term) => {
      searchTerm.value = term;
    };

    const filteredNoteEvents = computed(() => {
      if (searchTerm.value) {
        return noteEvents.value.filter(
          (noteEvent) =>
            noteEvent.content.includes(searchTerm.value) ||
            (noteEvent.tags && noteEvent.tags.includes(searchTerm.value))
        );
      } else {
        return noteEvents.value;
      }
    });

    let note = computed(() => {
        if (noteEvents?.value?.length > 0) {
            return noteEvents?.value?.[0] ? noteEvents.value[0] : null;
        }
    });

    watch(
        noteEvents, 
        (newEvents, oldEvents) => {
            console.log("noteEvents changed", { newEvents, oldEvents });
        }, 
        { deep: true }
    );

    const settings = { npub: user?.npub, kinds: [1, 30023] };

    nostrStore.fetchEvents(settings).catch(error => {
      console.error("Error fetching events:", error);
    });

    nostrStore.subscribeToEvents(settings).catch(error => {
      console.error("Error subscribing to events:", error);
    });

    return {
      filterNotes,
      filteredNoteEvents,
      note
    };
  },
};
</script>
