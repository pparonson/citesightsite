<template>
  <div class="my-2 mx-4">
    <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
    <NoteEventList :noteEvents="filteredNoteEvents" />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import NoteEventList from '@/components/NoteEventList.vue';
import { useNostrStore } from '@/store/nostr';
import { storeToRefs } from 'pinia';

export default {
  components: {
    MenuBar,
    NoteEventList,
  },
  setup() {
    // const { user, fetchEvents, subscribeToEvents, noteEvents } = useNostrStore();
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


    watch(
        noteEvents, 
        (newEvents, oldEvents) => {
            console.log("noteEvents changed", { newEvents, oldEvents });
        }, 
        { deep: true }
    );

    // watch(
    //   () => filteredNoteEvents,
    //   (newVal) => {
    //     console.log("Filtered events:", newVal);
    //   },
    //   { deep: true }
    // );

    console.log(`User: ${JSON.stringify(user, null, 2)}`);
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
    };
  },
};
</script>
