<!-- <template> -->
<!--   <div class="flex flex-col h-screen"> -->
<!--     <MenuBar :menuTarget="'/settings'" @search="filterNotes" /> -->
<!--     <div class="flex flex-1 overflow-hidden"> -->
<!--       <div class="flex flex-col w-1/3 p-1 overflow-y-auto overflow-x-hidden"> -->
<!--         <NoteEventList :noteEvents="filteredNoteEvents" /> -->
<!--       </div> -->
<!--       <div class="flex flex-col w-2/3 p-1 h-full overflow-y-auto overflow-x-hidden"> -->
<!--         <NoteEventDetailDisplay :noteEvent="note" /> -->
<!--       </div> -->
<!--     </div> -->
<!--   </div> -->
<!-- </template> -->

<template>
  <div class="flex h-screen">
      <div class="flex flex-col w-1/3 p-1 overflow-hidden">
        <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
        <div class="flex flex-1 overflow-y-auto overflow-x-hidden">
          <NoteEventList :noteEvents="filteredNoteEvents" />
        </div>
      </div>
      <div class="flex flex-col h-full w-2/3 p-1 overflow-y-auto overflow-x-hidden">
          <NoteEventDetailDisplay :noteEvent="note" />
      </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
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
    let latestNoteId = null;
    let note = {
  "id": "97fb038332b4ea4663893a1f5262ed5cb26215ccda9b7b3f3ff21e1df626f5bb",
  "created_at": 1705861968,
  "content": "# **TEST 0029**\n[Link to OpenAI](https://www.openai.com/)\n*Italicized text* and **bold text**.\n0000\n---\n\n\n",
  "kind": 1,
  "pubkey": "0a73152896371ed154ca7b38b8e1dce3e7ae83f78ac569902d30c1578f94d148",
  "url": "wss://relay.damus.io",
  "sig": "83784155080169d8e9e97f6d98969a8ee28e150d94a288cd93c13923c58fcda7a94b17036d43974edcd5304b9b4acf709afb2dcaad9ab0057398fcda4bcad06a",
  "tags": [
    [
      "title",
      "2024-01-21"
    ],
    [
      "t",
      "note"
    ],
    [
      "t",
      "test"
    ],
    [
      "t",
      "example"
    ],
    [
      "t",
      "sample_tag"
    ],
    [
      "d",
      "2024-01-21"
    ],
    [
      "v",
      "10"
    ],
    [
      "isUpdated",
      "true"
    ],
    [
      "e",
      "bb19ebb8da631dfd9cf694099a5ff7a1d3ab6deab49da9e704afe7e90233db35"
    ]
  ]
};
    
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
            [ latestNoteId ] = noteEvents.value;
        }, 
        { deep: true }
    );

    // console.log(`User: ${JSON.stringify(user, null, 2)}`);
    const settings = { npub: user?.npub, kinds: [1, 30023] };

    nostrStore.fetchEvents(settings).catch(error => {
      console.error("Error fetching events:", error);
    });

    nostrStore.subscribeToEvents(settings).catch(error => {
      console.error("Error subscribing to events:", error);
    });

    // const loadAndSortEvents = async () => {
    //   try {
    //     await nostrStore.fetchEvents(settings);
    //     nostrStore.sortNoteEventsByDateDesc();  
    //     console.log("Events are fetched and sorted by date.");
    //
    //     await nostrStore.subscribeToEvents(settings);
    //     nostrStore.sortNoteEventsByDateDesc();  
    //   } catch (error) {
    //     console.error("Error fetching or sorting events:", error);
    //   }
    // };

    return {
      filterNotes,
      filteredNoteEvents,
      latestNoteId,
      note
    };
  },
};
</script>
