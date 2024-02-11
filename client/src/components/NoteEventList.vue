<template>
    <div>
        <div v-if="noteEvents.length === 0" class="text-gray-500">No note events available.</div>
        <div v-else v-for="noteEvent in noteEvents" :key="noteEvent.id">
            <div @click="handleNoteClick(noteEvent.id)">
                <NoteEvent :noteEvent="noteEvent" />
            </div>
        </div>
    </div>
</template>

<script>
    import NoteEvent from "@/components/NoteEvent.vue";

    export default {
        name: "NoteEventList",
        components: {
            NoteEvent,
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
        },
        emits: ["noteSelected"],
        methods: {
            handleNoteClick(noteId) {
                this.$emit("noteSelected", noteId); // Emit the selected note id
            },
        },
    };
</script>

<style scoped>
    /* Add your styles here */
</style>
