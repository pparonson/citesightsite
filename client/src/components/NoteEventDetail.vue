<template>
  <div class="flex flex-col h-[85vh] overflow-hidden p-2 space-y-2">
    <form class="flex flex-col flex-1" @submit.prevent="saveNote">
      <tiptap v-model="localNote.content" />
      <div class="flex flex-wrap mb-4">
        <span 
            v-for="tag in (note ? note.tags : [])" 
            :key="tag" 
            class="bg-gray-200 px-2 py-1 text-sm text-gray-700 mr-2 rounded-md"> {{ tag }}
        </span>
      </div>
      <button type="submit" class="btn btn-primary h-10 self-start">Save</button>
    </form>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { useNostrStore } from '@/store/nostr';
import Tiptap from '@/components/Tiptap.vue';

export default {
  props: {
    id: String
  },
  components: {
    Tiptap
  },
  setup(props) {
    const localNote = ref({});
    const { getNoteEventFromState, fetchNoteEventById, publishEvent, note } = useNostrStore();

    watch(
        () => props.id,
        async (newId) => {
            if (newId) {
                await getNoteEventFromState(newId);
                if (note && Array.isArray(note.tags)) {
                    localNote.value.content = note.content;
                    localNote.value.tags = [...note.tags];
                } else {
                    localNote.value.content = '';
                    localNote.value.tags = [];
                }
            } else {
                localNote.value.content = '';
                localNote.value.tags = [];
            }
        },
        { immediate: true }
    );

    onMounted(async () => {
      // Phase 1: Get the event from store
      // getNoteEventFromState(eventId);

      // Phase 2: Asynchronously update the event detail from NDK API
      try {
          if (props.id) {
            await fetchNoteEventById(props.id);
            if (note && Array.isArray(note.tags)) {
                localNote.value.content = note.content;
                localNote.value.tags = [...note.tags];
            }
          }
      } catch (error) {
        console.error(`Error fetching note event detail: ${error}`);
      }
    });

    const saveNote = async () => {
      const noteToSave = {
        ...localNote.value,
        kind: 1 // set the kind here instead of mutating localNote
      };

      if (localNote.value?.id) {
          // Update existing note
          
          // Step 1: Retrieve the latest existing event to make sure we're not overwriting new data
          // const latestEvent = await fetchNoteEventById(eventId);
          // Proceed only if the note hasn't been updated elsewhere
          try {
              await publishEvent(noteToSave);
          } catch (error) {
              console.error(`Error publishing note event detail: ${error}`);
          }

          // Emit an event or update the UI to reflect the changes
          // ...

      } else {
        // Create a new note
        await publishEvent(noteToSave);
        // Emit an event or update the UI to reflect the changes
        // ...
      }
    };

    return {
      localNote,
      note,
      saveNote
    };
  }
}
</script>

<style>
  /* Your styles here */
</style>
