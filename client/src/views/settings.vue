<template>
    <div class="my-1 mx-2">
        <MenuBar :menuTarget="'/'" />
        <div class="mt-2">
            <div class="mt-2">
                <div class="flex space-x-1">
                    <!-- Light Theme Button -->
                    <!-- <button data-set-theme="light" data-act-class="ACTIVECLASS" class="btn btn-xs btn-accent m-1"> -->
                    <!--     Light -->
                    <!-- </button> -->

                    <!-- Dark Theme Button -->
                    <!-- <button data-set-theme="dark" data-act-class="ACTIVECLASS" class="btn btn-xs btn-accent m-1"> -->
                    <!--     Dark -->
                    <!-- </button> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { ref, computed, onMounted } from "vue";
    import MenuBar from "@/components/MenuBar.vue";
    // import { themeChange } from "theme-change";
    import { useNostrStore } from "@/store/nostr";

    export default {
        components: {
            MenuBar,
        },
        setup() {
            const { user, fetchEvents, subscribeToEvents, noteEvents } = useNostrStore();

            // onMounted(async () => {
            //     themeChange(false); // false param ensures it doesn't auto detect OS themes
            // });

            return {
            };
        },
    };
</script>
