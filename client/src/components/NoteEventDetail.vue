<template>
    <div class="flex flex-col h-[85vh] overflow-hidden p-2 space-y-2">
        <form class="flex flex-col flex-1" @submit.prevent="saveNote">
            <textarea
                v-model="localNote.content"
                class="flex-1 overflow-auto mb-4 p-2 border border-gray-300 resize-none h-[70vh] max-h-[70vh]"
            ></textarea>
            <div class="flex flex-wrap mb-4">
                <span
                    v-for="tag in keywordTags"
                    :key="tag"
                    class="bg-gray-200 px-2 py-1 text-sm text-gray-700 mr-2 rounded-md"
                >
                    {{ tag }}
                </span>
            </div>
            <button type="submit" class="btn btn-primary h-10 self-start">Save</button>
        </form>
    </div>
</template>

<script>
    import { ref, onMounted, watch, computed } from "vue";
    import { storeToRefs } from "pinia";
    import { useNostrStore } from "@/store/nostr";

    export default {
        props: {
            id: String,
        },
        setup(props) {
            const { getNoteEventFromState, fetchNoteEventById, publishEvent } = useNostrStore();
            let { note } = storeToRefs(useNostrStore());
            let localNote = ref({ tags: [] });
            const noteTitle = computed(() => {
                const titleTag = localNote.value.tags?.find(([key]) => key === "title");
                return titleTag ? titleTag[1] : "Unknown Title";
            });
            const keywordTags = computed(() => {
                return localNote.value.tags?.filter(([type]) => type === "t").map(([, value]) => value) || [];
            });
            const saveNote = async () => {
                const noteToSave = {
                    ...localNote.value,
                    content: localNote.value?.content,
                    kind: localNote.value.kind || 1,
                };
                try {
                    await publishEvent(noteToSave);
                } catch (error) {
                    console.error(`Error publishing note event detail: ${error}`);
                }
            };

            watch(
                () => useNostrStore().note,
                (newNote) => {
                    localNote.value = JSON.parse(JSON.stringify(newNote));
                },
                { deep: true }
            );

            onMounted(async () => {
                if (props?.id) {
                    await getNoteEventFromState(props.id);
                    await fetchNoteEventById(props.id);
                    console.log("Mounted note:", JSON.stringify(note));
                    console.log("Mounted localNote:", JSON.stringify(localNote.value));
                } else {
                    localNote.value = { content: "", tags: ["client"] };
                }
            });

            return {
                localNote,
                note: JSON.parse(JSON.stringify(localNote.value)),
                saveNote,
                noteTitle,
                keywordTags,
            };
        },
    };
</script>

<style>
    /* Your styles here */
</style>
