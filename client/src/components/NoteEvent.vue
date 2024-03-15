<template>
    <div :class="noteClasses" class="p-2 my-2 rounded-md">
        <div>{{ noteTitle }}</div>
        <div class="" v-html="renderedContent"></div>
        <Tags :tags="noteEvent?.tags || []" />
        <p class="text-base text-xs">ID: {{ noteEvent.id }}</p>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from "@/components/Tags.vue";
    import { ref, computed, watch } from "vue";
    import { useNostrStore } from "@/store/nostr";
    import { storeToRefs } from "pinia";

    function disableLinks(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const links = doc.querySelectorAll("a");

        links.forEach((link) => {
            link.removeAttribute("href"); // Remove the href attribute
            link.style.pointerEvents = "none"; // Disable pointer events
            link.style.color = "inherit"; // Make links the same color as the text
            link.style.textDecoration = "none"; // Remove the underline from links to indicate they are inactive
        });

        return doc.body.innerHTML;
    }
    export default {
        components: {
            Tags,
        },
        props: {
            noteEvent: {
                type: Object,
                required: true,
            },
        },
        setup(props) {
            const nostrStore = useNostrStore();
            const { selectedNote } = storeToRefs(nostrStore);
            const md = new MarkdownIt();
            const noteTitle = computed(() => {
                const titleTag = props.noteEvent.tags?.find(([key]) => key === "title");
                return titleTag ? titleTag[1] : "Unknown Title";
            });
            const renderedContent = computed(() => {
                const content = props.noteEvent?.content || "";
                let html = md.render(content.length > 200 ? content.substring(0, 200) : content);
                html = disableLinks(html);
                return DOMPurify.sanitize(html);
            });
            let isSelected = computed(() => selectedNote?.value?.id === props.noteEvent.id);
            let noteClasses = computed(() => ({
                "bg-orange-100": isSelected.value,
                "bg-gray-100": !isSelected.value,
            }));

            return {
                noteTitle,
                renderedContent,
                isSelected,
                noteClasses,
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
