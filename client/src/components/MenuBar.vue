<template>
    <div class="flex justify-between items-center px-1 py-1 space-x-2">
        <router-link :to="menuTarget" class="text-xl ml-1">
            <font-awesome-icon icon="gear" aria-label="Settings" />
        </router-link>

        <select v-model="searchScope" class="select select-bordered select-sm w-2/12 h-10 rounded-md focus:outline-none focus:border-blue-300">
            <option value="all">All</option>
            <option value="userTags">Tags</option>
        </select>

        <input
            v-model="searchTerm"
            @input="onInput"
            type="text"
            placeholder="Search"
            class="w-10/12 h-10 px-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:border-blue-300"
        />

        <router-link :to="'/note/new'">
            <div @click="createNewNote" class="text-xl mr-1">
                <font-awesome-icon icon="calendar-day" aria-label="Add new note" />
            </div>
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
            const searchTerm = ref("");
        const searchScope = ref("all");

            const onInput = debounce(() => {
                // emit("search", searchTerm.value);
                emit("search", { term: searchTerm.value, scope: searchScope.value });
            }, 300);

            const createNewNote = () => {
                console.log("Create New Note button clicked!");
            };

            return {
                searchTerm,
                searchScope,
                onInput,
                createNewNote,
            };
        },
    };
</script>

<style>
    /* Custom styles for the MenuBar component */
</style>
