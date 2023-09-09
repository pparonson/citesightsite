<template>
  <div class="px-4">
    <div class="mt-2 mb-2">
        <router-link to="/">
            <button class="btn btn-primary h-10 mx-2">
                <font-awesome-icon :icon="['fas', 'angles-left']" />
            </button>
        </router-link>
    </div>
    <div><NoteEventDetail :id="eventId" /></div>
  </div>
</template>

<script>
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import NoteEventDetail from '@/components/NoteEventDetail.vue';

export default {
  components: {
    NoteEventDetail
  },
  setup() {
    const router = useRouter();

    const eventId = computed(() => {
      const currentRoute = router.currentRoute.value;
      const params = currentRoute.params;
      const id = params.id;
      return id === 'new' ? null : id;
    });

    return {
      eventId
    };
  },
};
</script>
