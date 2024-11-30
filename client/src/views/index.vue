<template>
    <div class="flex h-screen">
        <div class="flex flex-col w-1/4 p-1 overflow-hidden">
            <MenuBar :menuTarget="'/settings'" @search="filterEvents" />
            <div class="flex flex-1 overflow-y-auto overflow-x-hidden">
                <NoteEventList
                    :noteEvents="filteredNoteEvents"
                    :annotations="filteredAnnotations"
                    :followsEvents="filteredFollowsEvents"
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
import version from "./../../version.json" with { type: 'json' };

const kind = config.nostr.config.encryptedLongFormNoteKind;

export default {
    components: {
        MenuBar,
        NoteEventList,
        NoteEventDetailDisplay,
    },
    setup() {
        console.log(`PenItIn version: ${version.version}`);  
        const nostrStore = useNostrStore();
        const annotationStore = useAnnotationStore();
        const authStore = useAuthStore();
        const { user, noteEvents, followsEvents, isFetchingEvents, missingEncryptionKey, missingOptionalCredentials } =
            storeToRefs(nostrStore);
        const { annotations } = storeToRefs(annotationStore);
        const { isLoggedIn } = storeToRefs(authStore);
        const searchParams = ref({ term: "", scope: "all" });
        const filterEvents = (params) => {
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

        // watch(
        //     () => isLoggedIn.value,
        //     async () => {
        //         if (isLoggedIn.value) {
        //             try {
        //                 await fetchAnnotationsAndEvents();
        //             } catch (error) {
        //                 console.error(
        //                     `Error: Failed to fetch annotations and events on login: ${error}`
        //                 );
        //             }
        //         }
        //     },
        //     { immediate: true }
        //
        // );

        const fetchAnnotationsAndEvents = async () => {
            if (isLoggedIn.value) {
                const settings = { kinds: [kind] };

                // Wrapper function to log errors separately
                const safeFetch = (promise) => 
                    promise.catch(error => ({ error }));

                const fetchResults = await Promise.allSettled([
                    safeFetch(nostrStore.fetchEvents(settings)),
                    safeFetch(nostrStore.fetchFollowsEvents()),
                    safeFetch(annotationStore.fetchAllAnnotations()),
                    safeFetch(nostrStore.subscribeToEvents(settings)),
                ]);

                // Handle individual results
                fetchResults.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const errorMessages = [
                            "Error fetching note events",
                            "Error fetching follows events",
                            "Error fetching annotations",
                            "Error subscribing to note events",
                        ];
                        console.error(`${errorMessages[index]}:`, result.reason ? result.reason : result.error);
                    }
                });

                const allFulfilled = fetchResults.every(result => result.status === 'fulfilled');
                if (allFulfilled) {
                    console.log("All fetch and subscriber operations completed successfully.");
                } else {
                    console.log("One or more fetch/subscriber operations encountered errors, handled individually.");
                }
            }
        };

        const filteredNoteEvents = computed(() => {
            const { term, scope } = searchParams.value;
            if (!term && scope) {
                switch (scope) {
                    case "all":
                        return noteEvents.value;
                    case "onlyNotes":
                        return noteEvents.value;
                    case "tags":
                        return noteEvents.value.filter((noteEvent) => {
                            const tags = (noteEvent.tags || [])
                                .filter((tag) => tag[0] === "t")
                                .map((tag) => tag[1].toLowerCase());
                            return tags.length > 0;
                        });
                    default:
                        return [];
                }
            } else {
                const lowercasedTerm = term.toLowerCase();

                return noteEvents.value.filter((noteEvent) => {
                    const contentMatch = noteEvent.content
                        ?.toLowerCase()
                        .includes(lowercasedTerm);
                    // Get tags of type 't' for this note event
                    const tags = (noteEvent.tags || [])
                        .filter((tag) => tag[0] === "t")
                        .map((tag) => tag[1].toLowerCase());

                    // Perform different comparisons based on search scope
                    switch (scope) {
                        case "all":
                            return (contentMatch || tags.includes(lowercasedTerm));
                        case "onlyNotes":
                            return contentMatch;
                        case "tags":
                            return tags.includes(lowercasedTerm);
                        default:
                            return [];
                    }
                });
            }
        });
        
        const filteredAnnotations = computed(() => {
            const { term, scope } = searchParams.value;
            if (!term && scope) {
                switch (scope) {
                    case "all":
                        return annotations.value;
                    case "tags":
                        return annotations.value.filter((annotation) => {
                            const tags = (annotation.tags || []).map(tag => tag.toLowerCase());
                            return tags.length > 0;
                        });
                    case "onlyAnnotations":
                        return annotations.value;
                    default:
                        return [];
                }
            }
            const lowercasedTerm = term.toLowerCase();
            return annotations.value.filter((annotation) => {
                // Filter logic based on term and scope
                const contentMatch = annotation.document
                    ?.title
                    ?.[0]
                    ?.toLowerCase()
                    .includes(lowercasedTerm);
                const tags = (annotation.tags || []).map(tag => tag.toLowerCase());
                switch (scope) {
                    case "all":
                        return contentMatch || tags.includes(lowercasedTerm);
                    case "tags":
                        return tags.includes(lowercasedTerm);
                    case "onlyAnnotations":
                        return contentMatch || tags.includes(lowercasedTerm);
                    default:
                        return [];
                }
            });
        });

        const filteredFollowsEvents = computed(() => {
            const { term, scope } = searchParams.value;
            if (!term && scope) {
                switch (scope) {
                    case "all":
                        return followsEvents.value;
                    case "onlyFollows":
                        return followsEvents.value;
                    case "tags":
                        return followsEvents.value.filter((event) => {
                            const tags = (event.tags || [])
                                .filter((tag) => tag[0] === "t")
                                .map((tag) => tag[1].toLowerCase());
                            return tags.length > 0;
                        });
                    default:
                        return [];
                }
            } else {
                const lowercasedTerm = term.toLowerCase();

                return followsEvents.value.filter((event) => {
                    const contentMatch = event.content
                        ?.toLowerCase()
                        .includes(lowercasedTerm);
                    // Get tags of type 't' for this note event
                    const tags = (event.tags || [])
                        .filter((tag) => tag[0] === "t")
                        .map((tag) => tag[1].toLowerCase());

                    // Perform different comparisons based on search scope
                    switch (scope) {
                        case "all":
                            return (contentMatch || tags.includes(lowercasedTerm));
                        case "onlyFollows":
                            return contentMatch;
                        case "tags":
                            return tags.includes(lowercasedTerm);
                        default:
                            return [];
                    }
                });
            }
        });

        return {
            filterEvents,
            filteredNoteEvents,
            filteredFollowsEvents,
            filteredAnnotations,
            isLoggedIn,
            isFetchingEvents,
            missingEncryptionKey,
            missingOptionalCredentials
        };
    },
};
</script>
