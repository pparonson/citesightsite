<template>
    <div>
        <div v-if="combinedEvents.length === 0" class="text-gray-500">No events found.</div>
        <div v-else v-for="event in combinedEvents" :key="event.id" >
            <div @click="handleEventClick(event)">
                <EventItem :event="event" />
            </div>
        </div>
    </div>
</template>

<script>
    import { computed, watch } from "vue";
    import { storeToRefs } from "pinia";
    import { useNostrStore } from "@/store/nostr";
    import EventItem from "@/components/EventItem.vue";

    export default {
        name: "NoteEventList",
        components: {
            EventItem,
        },
        props: {
            noteEvents: {
                type: Array,
                default: () => [],
                validator(value) {
                    return value.every(
                        (noteEvent) => noteEvent.hasOwnProperty("id") && noteEvent.hasOwnProperty("content")
                    );
                },
            },
            annotations: {
                type: Array,
                default: () => [],
                validator(value) {
                    return value.every(
                        (annotation) => annotation.hasOwnProperty("id") && annotation.hasOwnProperty("uri")
                    );
                },
            },
        },
        setup(props ) {
            const nostrStore = useNostrStore();
            const { selectedEvent } = storeToRefs(nostrStore);
            const combinedEvents = computed(() => {
                const mappedAnnotations = props.annotations.map(annotation => ({
                    ...annotation,
                    type: 'annotation',
                    content: annotation.text,
                    tags: annotation.tags.map(tag => ['t', tag]),
                }));

                const mappedNoteEvents = props.noteEvents.map(noteEvent => ({
                    ...noteEvent,
                    type: 'noteEvent',
                }));

                // Combine and remove duplicates based on id
                const uniqueEvents = [...mappedNoteEvents, ...mappedAnnotations].reduce((acc, current) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                return uniqueEvents.sort((a, b) => {
                    const dateA = a.created_at || a.created;
                    const dateB = b.created_at || b.created;
                    return new Date(dateB) - new Date(dateA);
                });
            });

            const handleEventClick = (event) => {
                nostrStore.setSelectedEvent(event);
            };

            watch(combinedEvents, (newEvents) => {
                if (newEvents.length > 0 && !selectedEvent.value) {
                    nostrStore.setSelectedEvent(newEvents[0]);
                }
            }, { immediate: true });

            return {
                combinedEvents,
                handleEventClick,
            };
        },
    }
</script>

<style scoped>
    /* Add your styles here */
</style>
