<template>
  <div class="p-4 bg-gray-200 my-2 rounded-md">
    <p class="mt-4">{{ noteEvent.content }}</p>
    <div v-if="noteEvent.tags && noteEvent.tags.length > 0" class="mt-2">
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
export default {
  props: {
    noteEvent: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style>
/* Custom styles for the NoteEvent component */
</style>







