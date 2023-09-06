<template>
  <div class="flex flex-col h-[85vh] overflow-hidden p-2 space-y-2">
    <form class="flex flex-col flex-1" @submit.prevent="saveNote">
      <tiptap v-model="note.content" />
      <div class="flex flex-wrap mb-4">
        <span 
            v-for="tag in note.tags" 
            :key="tag" 
            class="bg-gray-200 px-2 py-1 text-sm text-gray-700 mr-2 rounded-md"> {{ tag }}
        </span>
      </div>
      <button type="submit" class="btn btn-primary h-10 self-start">Save</button>
    </form>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import Tiptap from '@/components/Tiptap.vue';

export default {
  props: {
    initialNote: {
      type: Object,
      default: () => ({
        id: '',
        content: ''
      })
    }
  },
  components: {
    Tiptap
  },
  setup(props) {
    const note = ref({ ...props.initialNote });
    components: {
      Tiptap
    }
    watch(
        () => props.initialNote,
        (newVal) => {
            note.value = { ...newVal };
        },
        { deep: true }
    );

    const saveNote = () => {
      if (props.initialNote) {
        // Code to update an existing note
      } else {
        // Code to create a new note
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
</style>
