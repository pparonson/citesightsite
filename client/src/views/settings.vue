<template>
  <div class="my-2 mx-4">
    <MenuBar :menuTarget="'/'" />
    <div class="mt-2">
      <div class="mt-2">
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
import { useNostrStore } from '@/store/nostr';

export default {
  components: {
    MenuBar,
    TagColumn,
  },
  setup() {
    const { npub, fetchUser, fetchEvents, subscribeToEvents, noteEvents } = useNostrStore();
    
    const tags = computed(() => {
      const tagsSet = new Set();
      noteEvents.forEach(noteEvent => {
        if (noteEvent.tags) {
          noteEvent.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      return [...tagsSet];
    });

    onMounted(async () => {
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
