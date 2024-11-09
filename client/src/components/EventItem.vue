<template>
    <div :class="eventClasses" class="p-2 my-2 rounded-md">
        <div>{{ eventTitle }}</div>
        <div v-html="renderedContent"></div>
        <Tags :tags="event?.tags || []" />
        <p class="text-xs">Id: {{ event.id }}</p>
        <p class="text-xs">Type: {{ event.type }}</p>
    </div>
</template>

<script>
    import MarkdownIt from "markdown-it";
    import DOMPurify from "dompurify";
    import Tags from "@/components/Tags.vue";
    import { ref, computed, watch } from "vue";
    import { useNostrStore } from "@/store/nostr";
    import { useAnnotationStore } from "@/store/annotation";
    import { storeToRefs } from "pinia";

    function disableLinks(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const links = doc.querySelectorAll("a");

        links.forEach((link) => {
            link.removeAttribute("href"); // Remove href attribute
            link.style.pointerEvents = "none"; // Disable pointer events
            link.style.color = "inherit"; // Make links the same color as text
            link.style.textDecoration = "none"; // Remove underline from links to indicate inactive
        });

        return doc.body.innerHTML;
    }
    export default {
        components: {
            Tags,
        },
        props: {
            event: {
                type: Object,
                required: true,
            },
        },
        setup(props) {
            const nostrStore = useNostrStore();
            const annotationStore = useAnnotationStore();
            const { selectedEvent } = storeToRefs(nostrStore);
            const { selectedAnnotation } = storeToRefs(annotationStore);
            const md = new MarkdownIt();
            const eventTitle = computed(() => {
                if (props.event.type === 'annotation') {
                    return props.event.document?.title?.[0] || props.event.uri;
                } else {
                    const titleTag = props.event.tags?.find(([key]) => key === "title");
                    return titleTag ? titleTag[1] : "Unknown Title";
                }
            });

            const renderedContent = computed(() => {
                const content = props.event?.content || "";
                let html = md.render(content.length > 100 ? content.substring(0, 100) : content);
                html = disableLinks(html);
                return DOMPurify.sanitize(html);
            });
            let isSelected = computed(() => selectedEvent?.value?.id === props.event.id);
            let eventClasses = computed(() => ({
                "bg-yellow-100": isSelected.value,
                "bg-gray-100": !isSelected.value,
                "border-l-4": true,
                "border-green-500": props.event.type === 'noteEvent',
                "border-orange-500": props.event.type === 'annotation',
            }));

            return {
                eventTitle,
                renderedContent,
                eventClasses,
            };
        },
    };
</script>

<style>
    /* Custom styles for the NoteEvent component */
</style>
