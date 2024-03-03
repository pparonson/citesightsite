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

function updateLinksToOpenInNewTabs(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const links = doc.querySelectorAll('a');

  links.forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  return doc.body.innerHTML;
}
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
                // console.log("selectedNote changed: ", newValue);
                // console.log("selectedNote changed: ", selectedNote.value);
                noteEvent.value = newValue;
                const titleTag = noteEvent?.value?.tags?.find(([key]) => key === "title");
                noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";

                // Markdown update
                const content = noteEvent?.value?.content || "";
                let markdownOutput = md.render(content);
                // Update hyperlinks to open in new tabs
                markdownOutput = updateLinksToOpenInNewTabs(markdownOutput);
                renderedContent.value = DOMPurify.sanitize(markdownOutput, {
                    ADD_ATTR: ['target', 'rel'] // Allow "target" and "rel" attributes
                });
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
