<template>
    <div class="h-full p-2 my-1 bg-gray-100 rounded-md overflow-y-auto" @dblclick="handleDoubleClick">
        <Tags :tags="displayedTags" />
        <div class="text-xl font-bold mb-2">{{ displayedTitle }}</div>
        <!-- <p class="text-base text-xs overflow-hidden">ID: {{ noteEvent?.id }}</p> -->
        <!-- <p class="text-xs mb-2">Type: {{ noteEvent?.type }}</p> -->
        
        <p v-if="isAnnotation" class="text-sm mb-2">
            <strong>URI:  </strong> 
            <a :href="noteEvent.uri" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-blue-500 hover:text-blue-700 underline"
                >{{ noteEvent.uri }}</a>
        </p>
        <div v-if="isAnnotation && noteEvent.links && noteEvent.links.length > 0" class="mb-2">
            <strong>Links:  </strong>
            <ul>
                <li v-for="link in noteEvent.links" :key="link.href">
                    <a :href="link.href" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        >{{ link.href }}</a>
                </li>
            </ul>
        </div>

        <div class="mb-4" v-html="renderedContent"></div>
       
        <div class="mb-2">
            <p class="text-base text-xs overflow-hidden"><strong>ID:  </strong> {{ noteEvent?.id }}</p>
            <p class="text-xs"><strong>Type:  </strong> {{ noteEvent?.type }}</p>
            <p class="text-xs">
                <strong>Created:  </strong> 
                {{ noteEvent.created ? formatDate(noteEvent.created) : noteEvent.created_at ? formatDate(noteEvent.created_at) : "Invalid date" }}
            </p>
            <p v-if="isAnnotation" class="text-xs">
                <strong>Updated:  </strong> {{ formatDate(noteEvent.updated) }}
            </p>
        </div>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from "@/components/Tags.vue";
    import { ref, watch, computed } from "vue";
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
    link.classList.add('text-blue-500', 'hover:text-blue-700');
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
            const { selectedEvent } = storeToRefs(nostrStore);
            const md = new MarkdownIt();
            const noteTitle = ref("");
            const renderedContent = ref("");
            const noteEvent = ref(null);
            const formatDate = (dateString) => {
                return new Date(dateString).toLocaleString();
            };

            const isAnnotation = computed(() => noteEvent.value?.type === "annotation");
            const displayedTitle = computed(() => {
                if (isAnnotation.value) {
                    return noteEvent.value.document?.title[0] || "Untitled Annotation";
                } else {
                    const titleTag = noteEvent.value?.tags?.find(([key]) => key === "title");
                    return titleTag ? titleTag[1] : "Unknown Title";
                }
            });
            const displayedTags = computed(() => {
                if (isAnnotation.value) {
                    return noteEvent.value.tags || [];
                } else {
                    return noteEvent.value?.tags || [];
                }
            });

            const handleDoubleClick = () => {
                if (noteEvent.value?.id) {
                    router.push(`/note/${noteEvent.value.id}`);
                }
            };

            watch(selectedEvent, (newValue) => {
                noteEvent.value = newValue;
                const titleTag = noteEvent?.value?.tags?.find(([key]) => key === "title");
                noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";

                // Markdown update
                // const content = noteEvent?.value?.content || "";
                const content = isAnnotation.value ? noteEvent.value.text : (noteEvent.value?.content || "");
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
                isAnnotation,
                displayedTags,
                displayedTags,
                formatDate
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
