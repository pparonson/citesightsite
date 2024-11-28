<template>
    <div class="h-full p-2 my-1 bg-gray-100 rounded-md overflow-y-auto" 
        @dblclick="handleDoubleClick" 
        @click="handleClick"
        >
        <Tags :tags="displayedTags" />
        <div class="text-xl font-bold mb-2">{{ displayedTitle }}</div>
        
        <p v-if="isAnnotation" class="text-sm mb-2">
            <strong>URI:  </strong> 
            <a :href="event.uri" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-blue-500 hover:text-blue-700 italic underline"
                >{{ event.uri }}</a>
        </p>
        <div v-if="isAnnotation && event.links && event.links.length > 0" class="mb-2">
            <strong>Links:  </strong>
            <ul>
                <li v-for="link in event.links" :key="link.href">
                    <a :href="link.href" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        >{{ link.href }}</a>
                </li>
            </ul>
        </div>

        <div class="mb-4" v-html="renderedContent"></div>
       
        <div class="mb-2">
            <p class="text-base text-xs overflow-hidden"><strong>ID:  </strong> {{ event?.id }}</p>
            <p class="text-xs"><strong>Type:  </strong> {{ event?.type }}</p>
            <p class="text-xs">
                <strong>Created:  </strong> 
                {{ formatDate(event) }}
            </p>
            <p v-if="isAnnotation" class="text-xs">
                <strong>Updated:  </strong> {{ formatDate(event) }}
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
            link.classList.add('text-blue-500', 'italic', 'underline', 'hover:text-blue-300', 'external-link');
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
            const { selectedEvent, noteEvents, followsEvents } = storeToRefs(nostrStore);
            const md = new MarkdownIt();
            const noteTitle = ref("");
            const renderedContent = ref("");
            const event = ref(null);
            const formatDate = (event) => {
                let datetime = "Invalid date";
                if (event?.['created_at']) {
                    datetime = new Date(event.created_at * 1000).toLocaleString();
                }  
                if (event?.created) {
                    datetime = new Date(event.created).toLocaleString(); 
                } 
                if (event?.updated) {
                    datetime = new Date(event.updated).toLocaleString(); 
                } 
                return datetime;
            };
            const checkIfEventExists = (eventId) => {
                let result;
                result = noteEvents.value.find(event => {
                    return event.id === eventId;
                });

                if (!result) {
                    result = followsEvents.value.find(event => {
                        return event.id === eventId;
                    });
                }

                if (!result) {
                    result = annotations.value.find(event => {
                        return event.id === eventId;
                    });
                }
                return result;
            };
            const handleDoubleClick = () => {
                if (event.value?.id && event.value?.kind === 30024) {
                    router.push(`/note/${event.value.id}`);
                }
            };
            const handleClick = (event) => {
                if (event.target.matches('.internal-link')) {
                    event.preventDefault();
                    const eventId = event.target.dataset.eventId;
                    const linkedEvent = checkIfEventExists(eventId);
                    if (linkedEvent) {
                        nostrStore.setSelectedEvent(linkedEvent);
                    }
                }
            };
            const isAnnotation = computed(() => event.value?.type === "annotation");
            const displayedTitle = computed(() => {
                if (isAnnotation.value) {
                    return event.value.document?.title[0] || "Untitled Annotation";
                } else {
                    const titleTag = event.value?.tags?.find(([key]) => key === "title");
                    return titleTag ? titleTag[1] : "Unknown Title";
                }
            });
            const displayedTags = computed(() => {
                if (isAnnotation.value) {
                    return event.value.tags || [];
                } else {
                    return event.value?.tags || [];
                }
            });

            const updateRenderedContent = () => {
                const content = isAnnotation.value ? event.value.text : (event.value?.content || "");
                let markdownOutput = md.render(content);
                markdownOutput = updateLinksToOpenInNewTabs(markdownOutput);
                markdownOutput = parseLinks(markdownOutput, checkIfEventExists);
                renderedContent.value = DOMPurify.sanitize(markdownOutput, {
                    ADD_ATTR: ['target', 'rel'] 
                });
            };

            watch([selectedEvent, noteEvents, annotations], () => {
                event.value = selectedEvent.value;
                const titleTag = event?.value?.tags?.find(([key]) => key === "title");
                noteTitle.value = titleTag ? titleTag[1] : "Unknown Title";
                updateRenderedContent();
            }, { immediate: true, deep: true });

            return {
                noteTitle,
                renderedContent,
                event,
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
        @apply text-orange-500 hover:text-orange-300 italic underline;
    }
    .note-event-link {
        @apply text-green-500 hover:text-green-300 italic underline;
    }
    .follows-event-link {
        @apply text-purple-500 hover:text-purple-300 italic underline;
    }
    .broken-event-link {
        @apply text-red-600 hover:text-red-300 italic underline line-through;
    }
</style>
