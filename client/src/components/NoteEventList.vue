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
                        (event) => event.hasOwnProperty("id") && event.hasOwnProperty("content")
                    );
                },
            },
            followsEvents: {
                type: Array,
                default: () => [],
                validator(value) {
                    return value.every(
                        (event) => event.hasOwnProperty("id") && event.hasOwnProperty("content")
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

             const eventMap = new Map();

             const addEventsToMap = (events, type) => {
               events.forEach((event) => {
                 if (!eventMap.has(event.id)) {
                   eventMap.set(event.id, { ...event, type });
                 }
               });
             };

             addEventsToMap(props.annotations, 'annotation');
             addEventsToMap(props.noteEvents, 'noteEvent');
             addEventsToMap(props.followsEvents, 'followsEvent');

             return Array.from(eventMap.values()).sort((a, b) => {
               const dateA = new Date(a.updated || a.created || a.created_at * 1000).getTime();
               const dateB = new Date(b.updated || b.created || b.created_at * 1000).getTime();
               return dateB - dateA;
             });

                // const mappedAnnotations = props?.annotations?.map(annotation => ({
                //     ...annotation,
                //     type: 'annotation',
                //     content: annotation?.text,
                //     tags: annotation?.tags?.map(tag => ['t', tag]),
                // }));
                //
                // const mappedNoteEvents = props?.noteEvents?.map(noteEvent => ({
                //     ...noteEvent,
                //     type: 'noteEvent',
                // }));
                
                // const mappedFollowsEvents = props?.followsEvents?.map(event => ({
                //     ...event,
                //     type: 'followsEvent',
                // }));
                //
                // // Combine and remove duplicates based on id
                // const uniqueEvents = [...mappedNoteEvents, ...mappedAnnotations, ...mappedFollowsEvents].reduce((acc, current) => {
                //     const x = acc.find(item => item.id === current.id);
                //     if (!x) {
                //         return acc.concat([current]);
                //     } else {
                //         return acc;
                //     }
                // }, []);

                // Sort by datetime, prioritizing updated if available
                // return uniqueEvents.sort((a, b) => {
                //     const getTime = (date) => {
                //         if (typeof date === 'string') {
                //             return new Date(date).getTime();
                //         } else if (typeof date === 'number') {
                //             return new Date(date * 1000).getTime();
                //         }
                //         return 0;
                //     };
                //
                //     const dateA = getTime(a.updated || a.created || a['created_at']);
                //     const dateB = getTime(b.updated || b.created || b['created_at']);
                //     return dateB - dateA;
                // });
            });

            const handleEventClick = (event) => {
                console.log("Setting selected event to", event);
                nostrStore.setSelectedEvent(event);
            };

            watch(combinedEvents, (newEvents) => {
                if (newEvents.length > 0 && !selectedEvent.value) {
                    console.log("Setting selected event to first event in list");
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
