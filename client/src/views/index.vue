<template>
    <div class="flex h-screen">
        <div class="flex flex-col w-1/4 p-1 overflow-hidden">
            <MenuBar :menuTarget="'/settings'" @search="filterNotes" />
            <div class="flex flex-1 overflow-y-auto overflow-x-hidden">
                <NoteEventList
                    :noteEvents="filteredNoteEvents"
                    @noteSelected="handleNoteSelected"
                />
            </div>
        </div>
        <div
            class="flex flex-col h-full w-3/4 overflow-y-auto overflow-x-hidden"
        >

        <div v-if="missingEncryptionKey"
            class="alert alert-error shadow-lg mb-4"
            >
            <div>
                <span>Encryption Key is missing! Please provide it in the settings page for the app to work.</span>
            </div>
        </div>
        <div v-if="missingOptionalCredentials && showInitialLoadAlert" 
            class="alert alert-warning shadow-lg mb-4"
            >
            <div>
                <span>Optional Credentials (Relay URLs, Annotation API Account/Key) are missing!</span>
            </div>
        </div>

            <!-- <teleport to="body"> -->
            <!--     <div -->
            <!--         v-if="isLoggedIn && isFetchingEvents" -->
            <!--         class="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full" -->
            <!--         id="spinnerModal" -->
            <!--     > -->
            <!--         <div class="relative mx-auto mt-20 w-full max-w-lg h-96"> -->
            <!--             <div class="mt-3 text-center"> -->
            <!--                 <span -->
            <!--                     v-if="isLoggedIn && isFetchingEvents" -->
            <!--                     class="loading loading-spinner loading-lg" -->
            <!--                 ></span> -->
            <!--                 <p>Loading...</p> -->
            <!--             </div> -->
            <!--         </div> -->
            <!--     </div> -->
            <!-- </teleport> -->
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
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import config from "./../../config/config";

const customEventKind = config.nostr.config.encryptedLongFormNoteKind;

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
        const { user, noteEvents, selectedNote, isFetchingEvents, missingEncryptionKey, missingOptionalCredentials } =
            storeToRefs(nostrStore);
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
                console.error(
                    `Error: Failed to fetch annotations and events on mount: ${error}`
                );
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
                // kind 30024: custom encrypted long-form note kind
                const settings = { kinds: [1, customEventKind] };

                try {
                    await nostrStore.fetchEvents(settings);
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

                // try {
                //     await annotationStore.fetchAllAnnotations();
                //     console.log("Annotation store:", annotations.value);
                // } catch (error) {
                //     console.error(`Failed to fetch annotations: ${error}`);
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
                            return (
                                noteEvent.content.includes(lowercasedTerm) ||
                                userTags.includes(lowercasedTerm)
                            );
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

        return {
            filterNotes,
            filteredNoteEvents,
            handleNoteSelected,
            isLoggedIn,
            isFetchingEvents,
            missingEncryptionKey,
            missingOptionalCredentials
        };
    },
};
</script>
