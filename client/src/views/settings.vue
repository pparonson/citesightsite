<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <div class="mt-2">
                <div class="flex space-x-1">
                    <!-- Light Theme Button -->
                    <button data-set-theme="light" data-act-class="ACTIVECLASS" class="btn btn-xs btn-accent m-1">
                        Light
                    </button>

                    <!-- Dark Theme Button -->
                    <button data-set-theme="dark" data-act-class="ACTIVECLASS" class="btn btn-xs btn-accent m-1">
                        Dark
                    </button>
                </div>
                <!-- <Tags :tags="tags" /> -->
            </div>
        </div>
    </div>
</template>

<script>
    import { ref, computed, onMounted } from "vue";
    import MenuBar from "@/components/MenuBar.vue";
    import { themeChange } from "theme-change";
    // import Tags from "@/components/Tags.vue";
    import { useNostrStore } from "@/store/nostr";

    export default {
        components: {
            MenuBar,
            // Tags,
        },
        setup() {
            const { user, fetchEvents, subscribeToEvents, noteEvents } = useNostrStore();

            // const tags = computed(() => {
            //   const tagsSet = new Set();
            //   noteEvents.forEach(noteEvent => {
            //     if (noteEvent.tags) {
            //       noteEvent.tags.forEach(tag => tagsSet.add(tag));
            //     }
            //   });
            //   return [...tagsSet];
            // });

            onMounted(async () => {
                themeChange(false); // false param ensures it doesn't auto detect OS themes
                // const settings = { npub: user?.npub, kinds: [1, 30023] };
                //
                // try {
                //   await fetchEvents(settings);
                //   await subscribeToEvents(settings);
                // } catch (error) {
                //   console.error("Error fetching events:", error);
                // }
            });

            return {
                // tags,
            };
        },
    };
</script>
