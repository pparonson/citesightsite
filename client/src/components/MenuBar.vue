<template>
    <div class="flex justify-between items-center px-1 py-1 space-x-2">
        <router-link :to="menuTarget" class="text-xl ml-1">
            <font-awesome-icon icon="gear" aria-label="Settings" />
        </router-link>

        <input
            v-model="searchQuery"
            @input="onInput"
            type="text"
            placeholder="Search"
            class="w-11/12 h-10 px-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:border-blue-300"
        />

        <router-link :to="'/note/new'">
            <button @click="createNewNote" class="btn btn-primary h-10 mr-1">
                <font-awesome-icon icon="spinner" aria-label="Add new note" />
            </button>
        </router-link>
    </div>
</template>

<script>
    import { ref } from "vue";
    import { debounce } from "lodash";

    export default {
        props: {
            menuTarget: {
                type: String,
                required: true,
            },
        },
        setup(props, { emit }) {
            const searchQuery = ref("");

            const onInput = debounce(() => {
                emit("search", searchQuery.value);
            }, 300);

            const createNewNote = () => {
                console.log("Create New Note button clicked!");
            };

            return {
                searchQuery,
                onInput,
                createNewNote,
            };
        },
    };
</script>

<style>
    /* Custom styles for the MenuBar component */
</style>
