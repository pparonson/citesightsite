<template>
    <div class="p-2 bg-gray-100 my-1 rounded-md h-full overflow-y-auto">
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
            let html;
            const noteTitle = computed(() => {
                const titleTag = props.noteEvent?.tags?.find(([key]) => key === "title");
                return titleTag ? titleTag[1] : "Unknown Title";
            });
            const renderedContent = computed(() => {
                if (!props.noteEvent || !props.noteEvent.tags) {
                    html = md.render("Note not found"); 
                    return DOMPurify.sanitize(html);
                }
                const content = props.noteEvent?.content || "";
                html = md.render(content);
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
