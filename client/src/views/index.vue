<template>
  <div class="my-4 mx-4">
    <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
    <NoteEventList :noteEvents="filteredNoteEvents" />
  </div>
</template>

<script>
import { ref, computed, getCurrentInstance } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import NoteEventList from '@/components/NoteEventList.vue';
import useNostrState from '@/composables/nostr';

export default {
  components: {
    MenuBar,
    NoteEventList,
  },
  setup() {
    const { fetchEvents, subscribeToEvents, noteEvents } = useNostrState();
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

    const npub = getCurrentInstance().appContext?.config?.globalProperties?.user?.npub;
    const settings = { npub, kinds: [1] };

    fetchEvents(settings).catch(error => {
      console.error("Error fetching events:", error);
    });

    subscribeToEvents(settings).catch(error => {
      console.error("Error subscribing to events:", error);
    });

    return {
      filterNotes,
      filteredNoteEvents,
    };
  },
};
</script>
