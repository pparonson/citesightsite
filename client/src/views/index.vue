<template>
    <div class="flex h-screen">
        <div class="flex flex-col w-1/4 p-1 overflow-hidden">
            <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
            <div class="flex flex-1 overflow-y-auto overflow-x-hidden">
                <NoteEventList :noteEvents="filteredNoteEvents" @noteSelected="handleNoteSelected" />
            </div>
        </div>
        <div class="flex flex-col h-full w-3/4 overflow-y-auto overflow-x-hidden">
            <NoteEventDetailDisplay />
        </div>
    </div>
</template>

<script>
    import { ref, computed, onMounted, watch } from "vue";
    import MenuBar from "@/components/MenuBar.vue";
    import NoteEventList from "@/components/NoteEventList.vue";
    import NoteEventDetailDisplay from "@/components/NoteEventDetailDisplay.vue";
    import { useNostrStore } from "@/store/nostr";
    import { useAnnotationStore } from "@/store/annotation";
    import { useAuthStore } from '@/store/auth';
    import { storeToRefs } from "pinia";

    export default {
        components: {
            MenuBar,
            NoteEventList,
            NoteEventDetailDisplay,
        },
        setup() {
            const nostrStore = useNostrStore();
            const annotationStore = useAnnotationStore();
            const authStore = useAuthStore();
            const { user, noteEvents, selectedNote } = storeToRefs(nostrStore);
            const { annotations } = storeToRefs(annotationStore);
            const { isLoggedIn } = storeToRefs(authStore);
            const searchParams = ref({ term: "", scope: "all" });
            const filterNotes = (params) => {
                searchParams.value = params;
            };

            onMounted(async () => {
                try {
                    await fetchAnnotationsAndEvents();
                } catch (error) {
                    console.error(`Error: Failed to fetch annotations and events on mount: ${error}`);
                }
            });
            
            watch(
                () => isLoggedIn.value,
                async () => {
                    if (isLoggedIn.value) {
                        await fetchAnnotationsAndEvents();
                    }
                }
            );

            const fetchAnnotationsAndEvents = async () => {
                if (isLoggedIn.value) {
                    const settings = { kinds: [1, 30023] };
                    // try {
                    //     await annotationStore.fetchAllAnnotations();
                    //     console.log("Annotation store:", annotations.value);
                    // } catch (error) {
                    //     console.error(`Failed to fetch annotations: ${error}`);
                    // }

                    try {
                        await nostrStore.fetchEvents(settings);
                        // console.log("Fetched", noteEvents.value);
                        if (!selectedNote.value) {
                            nostrStore.setSelectedNoteById(noteEvents.value[0].id);
                        }
                    } catch (error) {
                        console.error("Error fetching events:", error);
                    }

                    // try {
                    //     await nostrStore.subscribeToEvents(settings);
                    // } catch (error) {
                    //     console.error("Error subscribing to events:", error);
                    // }

                }

            };

            const filteredNoteEvents = computed(() => {
                const { term, scope } = searchParams.value;
                if (!term) {
                    return noteEvents.value;
                } else {
                    const lowercasedTerm = term.toLowerCase();

                    return noteEvents.value.filter((noteEvent) => {
                        // Get tags of type 't' for this note event
                        const userTags = (noteEvent.tags || [])
                            .filter((tag) => tag[0] === "t")
                            .map((tag) => tag[1].toLowerCase());

                        // Perform different comparisons based on search scope
                        switch (scope) {
                            case "all":
                                return noteEvent.content.includes(lowercasedTerm) || userTags.includes(lowercasedTerm);
                            case "userTags":
                                return userTags.includes(lowercasedTerm);
                            default:
                                return false;
                        }
                    });
                }
            });

            const handleNoteSelected = (noteId) => {
                nostrStore.setSelectedNoteById(noteId);
            };

            // const settings = { npub: user?.npub, kinds: [1, 30023] };

            // nostrStore
            //     .fetchEvents(settings)
            //     .then((noteEvents) => {
            //         console.log("Fetched", noteEvents);
            //         if (!selectedNote.value) {
            //             nostrStore.setSelectedNoteById(noteEvents[0].id);
            //         }
            //     })
            //     .catch((error) => {
            //         console.error("Error fetching events:", error);
            //     });

            // TODO: subscribe causes issues with rerendering after updates
            // nostrStore.subscribeToEvents(settings).then((value) => {
            //     console.log("Subscribed", value);
            // }).catch((error) => {
            //     console.error("Error subscribing to events:", error);
            // });

            return {
                filterNotes,
                filteredNoteEvents,
                handleNoteSelected,
            };
        },
    };
</script>
