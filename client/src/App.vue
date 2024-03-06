<template>
    <div id="app">
        <!-- <RouterView :key="routeKey" /> -->
        <RouterView />
    </div>
</template>

<script>
    import { computed, ref, watch } from 'vue';
    import { RouterView, useRoute } from "vue-router";
export default {
  setup() {
    // const route = useRoute();
    // const uniqueKey = ref(Date.now()); // set an initial value
    //
    // watch(() => route.path, (newPath, oldPath) => {
    //   if (newPath === '/' && newPath !== oldPath) {
    //     uniqueKey.value = Date.now(); // any unique value to trigger component recreation
    //   }
    // });
    //
    // const routeKey = computed(() => `${route.path}-${uniqueKey.value}`);

    // return { routeKey };
    return {};
  },
};
</script>

<style>
    /* Add your global styles here */
</style>
