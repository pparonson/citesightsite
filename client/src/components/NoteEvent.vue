<template>
  <div class="p-4 bg-gray-200 my-2 rounded-md">
    <div v-if="noteEvent?.content && noteEvent.content?.length > 500" 
         v-html="`${renderedContent}...`">
    </div>
    <div v-else v-html="renderedContent"></div>
    <div v-if="noteEvent?.tags && noteEvent?.tags?.length > 0" class="mt-2">
      <span
        v-for="tag in noteEvent.tags"
        :key="tag"
        class="bg-blue-500 text-white px-2 py-1 mr-2 rounded-md"
      >
        {{ tag }}
      </span>
    </div>
    <p class="text-base">ID: {{ noteEvent.id }}</p>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

export default {
  props: {
    noteEvent: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const md = new MarkdownIt();

    const renderedContent = computed(() => {
      const content = props.noteEvent?.content || '';
      const html = md.render(content.length > 500 ? content.substring(0, 500) : content);
      return DOMPurify.sanitize(html);
    });

    return {
      renderedContent,
    };
  },
};
</script>

<style>
/* Custom styles for the NoteEvent component */
</style>







