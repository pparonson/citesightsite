<template>
  <div class="flex flex-col h-[85vh] overflow-hidden p-2 space-y-2">
    <form class="flex flex-col flex-1" @submit.prevent="saveNote">
      <textarea v-model="localNote.content" class="flex-1 overflow-auto mb-4 p-2 border border-gray-300 resize-none h-[70vh] max-h-[70vh]"></textarea>
      <div class="flex flex-wrap mb-4">
        <span 
            v-for="tag in (localNote ? localNote.tags : [])" 
            :key="tag" 
            class="bg-gray-200 px-2 py-1 text-sm text-gray-700 mr-2 rounded-md"> {{ tag }}
        </span>
      </div>
      <button type="submit" class="btn btn-primary h-10 self-start">Save</button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia'
import { useNostrStore } from '@/store/nostr';

export default {
  props: {
    id: String
  },
  setup(props) {
    const { getNoteEventFromState, fetchNoteEventById, publishEvent } = useNostrStore();
    let { note } = storeToRefs( useNostrStore() );
    let localNote = ref({});
    watch(() => useNostrStore().note, (newNote) => {
        localNote.value = JSON.parse(JSON.stringify(newNote));
    }, { deep: true });
    onMounted(
        async () => {
            if (props?.id) {
                await getNoteEventFromState(props.id);
                await fetchNoteEventById(props.id);
                console.log("Mounted note:", JSON.stringify(note));
                console.log("Mounted localNote:", JSON.stringify(localNote.value));
            } else {
               localNote.value = {content: '', tags: ['client']}
            }
        }
    );

    const saveNote = async () => {
      const noteToSave = {
        ...localNote.value,
        content: localNote.value?.content,
        kind: localNote.value.kind || 1
      };

      if (noteToSave?.id) {
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
      note: JSON.parse(JSON.stringify(localNote.value)),
      saveNote
    };
  }
}
</script>

<style>
  /* Your styles here */
</style>
