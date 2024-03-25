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
    import { ref, computed, onMounted } from "vue";
    import MenuBar from "@/components/MenuBar.vue";
    import NoteEventList from "@/components/NoteEventList.vue";
    import NoteEventDetailDisplay from "@/components/NoteEventDetailDisplay.vue";
    import { useNostrStore } from "@/store/nostr";
    import { storeToRefs } from "pinia";

    export default {
        components: {
            MenuBar,
            NoteEventList,
            NoteEventDetailDisplay,
        },
        setup() {
            const nostrStore = useNostrStore();
            const { user, noteEvents, selectedNote } = storeToRefs(nostrStore);
            const searchParams = ref({ term: "", scope: "all" });
            const filterNotes = (params) => {
                searchParams.value = params;
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

            const settings = { npub: user?.npub, kinds: [1, 30023] };

            nostrStore
                .fetchEvents(settings)
                .then((noteEvents) => {
                    console.log("Fetched", noteEvents);
                    if (!selectedNote.value) {
                        nostrStore.setSelectedNoteById(noteEvents[0].id);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching events:", error);
                });

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
