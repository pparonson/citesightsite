<template>
    <div class="p-4 bg-gray-200 my-2 rounded-md">
        <div>{{ noteTitle }}</div>
        <div v-if="noteEvent?.content && noteEvent.content?.length > 500" v-html="`${renderedContent}...`"></div>
        <div v-else v-html="renderedContent"></div>
        <div v-if="keywordTags && keywordTags.length > 0" class="mt-2">
            <span v-for="tag in keywordTags" :key="tag" class="bg-blue-500 text-white px-2 py-1 mr-2 rounded-md">
                {{ tag }}
            </span>
        </div>
        <p class="text-base">ID: {{ noteEvent.id }}</p>
    </div>
</template>

<script>
    import { ref, computed } from "vue";
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";

    export default {
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
                const html = md.render(content.length > 500 ? content.substring(0, 500) : content);
                return DOMPurify.sanitize(html);
            });
            const keywordTags = computed(() => {
                return props.noteEvent.tags?.filter(([type]) => type === "t").map(([, value]) => value) || [];
            });

            return {
                noteTitle,
                renderedContent,
                keywordTags,
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
