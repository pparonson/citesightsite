<template>
    <div class="bg-gray-100 p-2 my-2 rounded-md">
        <div>{{ noteTitle }}</div>
        <div class="" v-html="renderedContent"></div>
        <Tags :tags="noteEvent?.tags" />
        <p class="text-base text-xs">ID: {{ noteEvent.id }}</p>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from '@/components/Tags.vue';
    import { ref, computed } from "vue";
    export default {
        components: {
            Tags
        },
        props: {
            noteEvent: {
                type: Object,
                required: true,
            },
        },
        setup(props) {
            const md = new MarkdownIt();
            const noteTitle = computed(() => {
                const titleTag = props.noteEvent.tags?.find(([key]) => key === "title");
                return titleTag ? titleTag[1] : "Unknown Title";
            });
            const renderedContent = computed(() => {
                const content = props.noteEvent?.content || "";
                const html = md.render(content.length > 200 ? content.substring(0, 200) : content);
                return DOMPurify.sanitize(html);
            });

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
