<template>
    <div class="h-full p-2 my-1 bg-gray-100 rounded-md overflow-y-auto" 
        @dblclick="handleDoubleClick" 
        @click="handleClick"
        >
        <Tags :tags="displayedTags" />
        <div class="text-xl font-bold mb-2">{{ displayedTitle }}</div>
        
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
                {{ noteEvent?.created ? formatDate(noteEvent.created) : noteEvent?.created_at ? formatDate(noteEvent.created_at) : "Invalid date" }}
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
    import { useAnnotationStore } from "@/store/annotation";
    import { useNostrStore } from "@/store/nostr";
    import { useRoute, useRouter } from "vue-router";
    import { storeToRefs } from "pinia";
    import { parseLinks } from '@/utils/linkParser.js';

    function updateLinksToOpenInNewTabs(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const links = doc.querySelectorAll('a');

        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            link.classList.add('text-blue-700', 'hover:text-blue-300', 'external-link');
        });
        return doc.body.innerHTML;
    }
    export default {
        components: {
            Tags,
        },
        setup(props) {
            const annotationStore = useAnnotationStore();
            const nostrStore = useNostrStore();
            const router = useRouter();
            const { annotations } = storeToRefs(annotationStore);
            const { selectedEvent, noteEvents } = storeToRefs(nostrStore);
            const md = new MarkdownIt();
            const noteTitle = ref("");
            const renderedContent = ref("");
            const noteEvent = ref(null);
            const formatDate = (dateString) => {
                return new Date(dateString).toLocaleString();
            };
            const checkIfEventExists = (eventId) => {
                let result;
                result = noteEvents.value.find(event => {
                    return event.id === eventId;
                });

                if (!result) {
                    result = annotations.value.find(event => {
                        return event.id === eventId;
                    });
                }
                return result;
            };
            const handleDoubleClick = () => {
                if (noteEvent.value?.id) {
                    router.push(`/note/${noteEvent.value.id}`);
                }
            };
            const handleClick = (event) => {
                console.log(event);
                if (event.target.matches('.internal-link')) {
                    event.preventDefault();
                    // const noteTitle = event.target.dataset.noteTitle;
                    // const linkedEvent = noteEvents.value.find(event => {
                    //     const titleTag = event.tags.find(tag => tag[0] === 'title');
                    //     return titleTag && titleTag[1].toLowerCase() === noteTitle.toLowerCase();
                    // });
                    // if (linkedEvent) {
                    //     nostrStore.setSelectedEvent(linkedEvent);
                    //     router.push(`/note/${linkedEvent.id}`);
                    // }
                }
            };
            const isAnnotation = computed(() => noteEvent.value?.type === "annotation");
            const displayedTitle = computed(() => {
                if (isAnnotation.value) {
                    // TODO: noteEvent may not be correct for annotation type here
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
            watch(selectedEvent, (newValue) => {
                console.log("Selected event changed", newValue);
                noteEvent.value = newValue;
                const titleTag = noteEvent?.value?.tags?.find(([key]) => key === "title");
                noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";

                const content = isAnnotation.value ? noteEvent.value.text : (noteEvent.value?.content || "");
                let markdownOutput = md.render(content);
                markdownOutput = updateLinksToOpenInNewTabs(markdownOutput);
                markdownOutput = parseLinks(markdownOutput, checkIfEventExists);
                renderedContent.value = DOMPurify.sanitize(markdownOutput, {
                    ADD_ATTR: ['target', 'rel'] 
                });
            }, { immediate: true });

            return {
                noteTitle,
                renderedContent,
                noteEvent,
                handleDoubleClick,
                handleClick,
                isAnnotation,
                displayedTags,
                displayedTags,
                formatDate
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEventDetailDisplay component */
    .annotation-event-link {
        @apply text-orange-700 hover:text-orange-300 italic;
    }
    .note-event-link {
        @apply text-purple-700 hover:text-purple-300 italic;
    }
    .broken-event-link {
        @apply text-red-700 hover:text-red-300 italic line-through;
    }
</style>
