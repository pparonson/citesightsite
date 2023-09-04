<template>
  <div class="flex justify-between items-center p-4 space-x-2">
    <router-link :to="menuTarget" class="text-xl">
      <font-awesome-icon icon="bars" aria-label="Menu"></font-awesome-icon>
    </router-link>

    <input
      v-model="searchQuery"
      @input="onInput"
      type="text"
      placeholder="Search"
      class="w-11/12 h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:border-blue-300"
    />
  </div>
</template>

<script>
import { ref } from 'vue';
import { debounce } from 'lodash';

export default {
  props: {
    menuTarget: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const searchQuery = ref("");

    const onInput = debounce(() => {
      emit('search', searchQuery.value);
    }, 300);

    return {
      searchQuery,
      onInput
    };
  },
};
</script>

<style>
/* Custom styles for the MenuBar component */
</style>
