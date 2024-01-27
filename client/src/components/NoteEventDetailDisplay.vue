<template>
    <div class="p-2 bg-gray-100 my-1 rounded-md h-full overflow-y-auto">
        <div>{{ noteTitle }}</div>
        <p class="text-base text-xs overflow-hidden">ID: {{ noteEvent.id }}</p>
        <Tags :tags="noteEvent?.tags" />
        <div class="" v-if="noteEvent?.content && noteEvent.content?.length > 500" v-html="`${renderedContent}...`"></div>
        <div class="" v-else v-html="renderedContent"></div>
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
                const html = md.render(content);
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
