<template>
  <div class="p-4">
    <h2 class="text-xl font-bold">Tags</h2>
    <div v-if="tags.length === 0" class="text-gray-500">No tags available.</div>
    <ul v-else class="mt-4">
      <li
        v-for="tag in tags"
        :key="tag"
        class="inline-block max-w-xs overflow-hidden text-ellipsis bg-blue-500 text-white px-2 py-1 my-1 rounded-md mr-1"
      >
        {{ tag }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    tags: {
      type: Array,
      required: true,
      validator(value) {
        return value.every(tag => typeof tag === 'string');
      }
    },
  },
};
</script>

<style>
/* Custom styles for the TagColumn component */
</style>

