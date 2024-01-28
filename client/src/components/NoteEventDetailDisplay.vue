<template>
    <div class="h-full p-2 my-1 bg-gray-100 rounded-md overflow-y-auto">
        <Tags :tags="noteEvent?.tags" />
    <router-link :to="`/note/${noteEvent?.id}`">
        <div>{{ noteTitle }}</div>
        <p class="text-base text-xs overflow-hidden">ID: {{ noteEvent?.id }}</p>
        <div class="" v-html="renderedContent"></div>
      </router-link>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from '@/components/Tags.vue';
    import { ref, watch } from "vue";
    export default {
        components: {
            Tags
        },
        props: {
            noteEvent: {
                type: Object,
                default: () => ({}),
                required: false,
            },
        },
        setup(props) {
            const md = new MarkdownIt();
            const noteTitle = ref('');
            const renderedContent = ref('');

            watch(() => props.noteEvent, (newNoteEvent, oldNoteEvent) => {
                console.log('noteEvent prop changed', newNoteEvent);
                if (newNoteEvent) {
                    const titleTag = props.noteEvent?.tags?.find(([key]) => key === "title");
                    noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";

                    // Markdown update
                    const content = newNoteEvent.content || "";
                    const markdownOutput = md.render(content);
                    renderedContent.value = DOMPurify.sanitize(markdownOutput);
                }
            }, { immediate: true });

            return {
                noteTitle,
                renderedContent,
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
