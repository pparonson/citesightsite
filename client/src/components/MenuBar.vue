<template>
    <div class="flex justify-between items-center px-1 py-1 space-x-2">
        <router-link :to="menuTarget" class="text-xl ml-1">
            <font-awesome-icon icon="gear" aria-label="Settings" />
        </router-link>

        <!-- Dropdown for selecting the search scope -->
        <select v-model="searchScope" class="w-2/12 rounded-md border border-gray-300">
            <option value="all">All</option>
            <option value="userTags">User Tags Only</option>
            <!-- Add more options for other filters in the future here -->
        </select>

        <input
            v-model="searchTerm"
            @input="onInput"
            type="text"
            placeholder="Search"
            class="w-9/12 h-10 px-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:border-blue-300"
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
