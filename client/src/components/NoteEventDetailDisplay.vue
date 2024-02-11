<template>
    <div class="h-full p-2 my-1 bg-gray-100 rounded-md overflow-y-auto" @dblclick="handleDoubleClick">
        <Tags :tags="noteEvent?.tags" />
        <div>{{ noteTitle }}</div>
        <p class="text-base text-xs overflow-hidden">ID: {{ noteEvent?.id }}</p>
        <div class="" v-html="renderedContent"></div>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from "@/components/Tags.vue";
    import { ref, watch } from "vue";
    import { useNostrStore } from "@/store/nostr";
    import { useRoute, useRouter } from "vue-router";
    import { storeToRefs } from "pinia";

    export default {
        components: {
            Tags,
        },
        setup(props) {
            const nostrStore = useNostrStore();
            const router = useRouter();
            const { selectedNote } = storeToRefs(nostrStore);
            const md = new MarkdownIt();
            const noteTitle = ref("");
            const renderedContent = ref("");
            const noteEvent = ref(null);

            const handleDoubleClick = () => {
                if (noteEvent.value?.id) {
                    router.push(`/note/${noteEvent.value.id}`);
                }
            };

            watch(selectedNote, (newValue) => {
                console.log("selectedNote changed: ", newValue);
                console.log("selectedNote changed: ", selectedNote.value);
                noteEvent.value = newValue;
                const titleTag = noteEvent?.value?.tags?.find(([key]) => key === "title");
                noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";

                // Markdown update
                const content = noteEvent?.value?.content || "";
                const markdownOutput = md.render(content);
                renderedContent.value = DOMPurify.sanitize(markdownOutput);
            });

            return {
                noteTitle,
                renderedContent,
                noteEvent,
                handleDoubleClick,
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
