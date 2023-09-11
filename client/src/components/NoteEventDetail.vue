<template>
  <div class="flex flex-col h-[85vh] overflow-hidden p-2 space-y-2">
    <form class="flex flex-col flex-1" @submit.prevent="saveNote">
      <tiptap v-model="note.content" />
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
import { watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia'
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
    const { getNoteEventFromState, fetchNoteEventById, publishEvent } = useNostrStore();
    const { note } = storeToRefs( useNostrStore() );

    onMounted(
        async () => {
            if (props?.id) {
                await getNoteEventFromState(props.id);
                await fetchNoteEventById(props.id);
                console.log("Mounted note:", JSON.stringify(note));
            } else {
               note = {content: '', tags: []}
            }
        }
    );

    const saveNote = async () => {
      const noteToSave = {
        ...note,
        kind: 1
      };

      if (note?.id) {
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
      note,
      saveNote
    };
  }
}
</script>

<style>
  /* Your styles here */
</style>
