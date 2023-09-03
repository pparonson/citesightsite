<template>
  <div class="my-4 mx-4">
    <MenuBar :menuTarget="'/'" />
    <div class="mt-8">
      <div class="mt-4">
        <TagColumn :tags="tags" />
        <!-- Other settings content goes here -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import TagColumn from "@/components/TagColumn.vue";
import useNostrState from '@/composables/nostr';

export default {
  components: {
    MenuBar,
    TagColumn,
  },
  setup() {
    const { fetchUser, fetchEvents, subscribeToEvents, noteEvents } = useNostrState();
    
    const tags = computed(() => {
      const tagsSet = new Set();
      noteEvents.value.forEach(noteEvent => {
        if (noteEvent.tags) {
          noteEvent.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      return [...tagsSet];
    });

    onMounted(async () => {
      const npub = 'npub1pfe322ykxu0dz4x20vut3cwuu0n6aqlh3tzknypdxrq40ru569yqnes7z6';
      const settings = { npub, kinds: [1] };

      try {
        await fetchUser(npub);
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      try {
        await fetchEvents(settings);
        await subscribeToEvents(settings);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    });

    return {
      tags,
    };
  },
};
</script>
