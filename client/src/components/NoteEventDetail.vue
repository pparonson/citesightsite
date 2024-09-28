<template>
    <div class="flex flex-col h-[93vh] overflow-hidden px-2 py-1 space-y-2">
        <form class="flex flex-col h-full" @submit.prevent="handleSave">
            <div 
                ref="editorRef" 
                class="flex-1 mb-2 border border-gray-300 overflow-y-auto">
            </div>
            <!-- <div> -->
            <!--     <textarea -->
            <!--         v-model="localNote.content" -->
            <!--         class="flex-1 overflow-auto mb-2 p-2 border border-gray-300 resize-none h-[80vh] max-h-[80vh]" -->
            <!--     ></textarea> -->
            <!-- </div> -->
            <div class="flex flex-col space-y-2">
                <div class="flex flex-wrap flex-1 mb-1">
                    <Tags :tags="localNote?.tags || []" :editable="true" @remove="handleTagRemoval" />
                </div>

                <div class="flex items-center justify-between mt-4 mb-1">
                    <input
                        type="text"
                        v-model="newTag"
                        @keydown.enter.prevent="addTag"
                        placeholder="Enter new tag"
                        class="w-1/10 p-2 border border-gray-300 rounded text-sm h-8"
                    />
                    <button type="button" @click="addTag" class="btn btn-secondary ml-2 text-sm">
                        Tag it! <font-awesome-icon icon="tags" aria-label="tagIt" />
                    </button>

                    <span class="flex-1"></span>

                    <button type="submit" class="btn btn-primary ml-auto mr-6 text-sm self-start">
                        Pen it in! <font-awesome-icon icon="pen" aria-label="penItIn" />
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>

<script>
    import Tags from "@/components/Tags.vue";
    import { ref, onMounted, watch, computed } from "vue";
    import { storeToRefs } from "pinia";
    import { useRouter } from "vue-router";
    import { useNostrStore } from "@/store/nostr";
    import config from "./../../config/config.js";
    import { EditorState } from "@codemirror/state";
    import { EditorView, keymap, drawSelection, lineNumbers } from "@codemirror/view"
    import { defaultKeymap, history, undo, redo } from "@codemirror/commands"
    import { vim } from "@replit/codemirror-vim"

    export default {
        components: {
            Tags,
        },
        props: {
            id: String,
        },
        setup(props) {
            const router = useRouter();
            const nostrStore = useNostrStore();
            let { note } = storeToRefs(nostrStore);
            let localNote = ref({ content: '', tags: [] });
            let newTag = ref("");

            const editorRef = ref(null);
            let editorView = null;

            const Theme = EditorView.theme({
                "&": {
                    fontSize: "110%",
                }
            });

            const initializeEditor = () => {
                if (editorRef.value) {
                    let startState = EditorState.create({
                        doc: localNote.value.content || '',
                        extensions: [
                            vim(),
                            keymap.of([
                                { key: "u", run: undo },
                                { key: "Ctrl-r", run: redo }
                            ]),
                            keymap.of(defaultKeymap),
                            history(),
                            EditorView.lineWrapping,
                            drawSelection(),
                            lineNumbers(),
                            Theme
                        ]
                    })

                    editorView = new EditorView({
                        state: startState,
                        parent: editorRef.value,
                    })
                }
            };

            const noteTitle = computed(() => {
                const titleTag = localNote.value.tags?.find(([key]) => key === "title");
                return titleTag ? titleTag[1] : "Unknown Title";
            });

            const handleSave = async () => {
                if (editorView) {
                    localNote.value.content = editorView.state.doc.toString();
                }
                const noteToSave = {
                    ...localNote.value,
                    content: localNote.value?.content,
                    kind: localNote.value.kind || 1,
                };
                try {
                    await nostrStore.publishEvent(noteToSave);
                    nostrStore.setSelectedNoteById(null); // index.vue will reset selected note after re-fetch
                } catch (error) {
                    console.error(`Error publishing note event detail: ${error}`);
                } finally {
                    router.push("/");
                }
            };

            const addTag = () => {
                const tagExists = localNote.value.tags.some(
                    ([key, value]) => value.trim().toLowerCase() === newTag.value.trim().toLowerCase()
                );
                if (newTag.value && !tagExists) {
                    localNote.value.tags.push(["t", String(newTag.value).toLowerCase()]);
                    newTag.value = "";
                }
            };

            const handleTagRemoval = (tagToRemove) => {
                const tagIndex = localNote?.value?.tags?.findIndex((tag) => tag[1] === tagToRemove);
                if (tagIndex > -1) {
                    localNote.value.tags.splice(tagIndex, 1);
                }
            };

            watch(
                () => useNostrStore().note,
                async (newNote) => {
                    localNote.value = JSON.parse(JSON.stringify(newNote));

                    // await nostrStore.getNoteEventFromState(newId);
                    // await nostrStore.fetchNoteEventById(newId);
                    if (editorView && localNote.value && localNote.value.content) {
                        editorView.dispatch({
                            changes: {
                                from: 0,
                                to: editorView.state.doc.length,
                                insert: localNote.value.content,
                            },
                        });
                    }
                },
                { deep: true }
            );

            onMounted(async () => {
                if (props?.id) {
                    await nostrStore.getNoteEventFromState(props.id);
                    await nostrStore.fetchNoteEventById(props.id);
                    console.log("Mounted note:", JSON.stringify(note));
                    console.log("Mounted localNote:", JSON.stringify(localNote.value));
                } else {
                    localNote.value = { content: "", tags: ["client"] };
                }

                initializeEditor();
            });

            return {
                localNote,
                newTag,
                note: JSON.parse(JSON.stringify(localNote.value)),
                handleSave,
                noteTitle,
                handleTagRemoval,
                addTag,
                editorRef,
            };
        },
    };
</script>

<style scoped>
    .btn {
        @apply h-8;
        @apply min-h-[2rem];
    }
</style>
