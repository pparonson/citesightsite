<template>
    <div class="flex justify-between items-center px-1 py-1 space-x-2">
        <router-link :to="menuTarget" class="text-xl ml-1">
            <font-awesome-icon icon="gear" aria-label="Settings" />
        </router-link>

        <select 
            v-if="!isSettingsRoute"
            v-model="searchScope" 
            @change="onChange"
            class="select select-bordered select-sm w-3/12 h-10 rounded-md focus:outline-none focus:border-blue-300">
            <option value="all">All</option>
            <option value="tags">Tags</option>
            <option value="onlyNotes">Notes</option>
            <option value="onlyFollows">Follows</option>
            <option value="onlyAnnotations">Annotations</option>

        </select>

        <input
            v-if="!isSettingsRoute"
            v-model="searchTerm"
            @input="onInput"
            type="text"
            placeholder="Search"
            class="w-9/12 h-10 px-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:border-blue-300"
        />

        <router-link :to="'/note/new'" v-if="!isSettingsRoute">
            <div @click="createNewNote" class="text-xl mr-1">
                <font-awesome-icon icon="square-plus" aria-label="Add new note" />
            </div>
        </router-link>
    </div>
</template>

<script>
    import { ref, computed } from "vue";
    import { debounce } from "lodash";
    import { useRouter } from "vue-router";

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
            const router = useRouter();

            const isSettingsRoute = computed(() => {
                return router.currentRoute.value.name.toLowerCase() === 'settings';
            });

            const onChange = () => {
                emit("search", { term: searchTerm.value, scope: searchScope.value });
            };

            const onInput = debounce(() => {
                emit("search", { term: searchTerm.value, scope: searchScope.value });
            }, 300);

            const createNewNote = () => {
                console.log("Create New Note button clicked!");
            };

            return {
                searchTerm,
                searchScope,
                isSettingsRoute,
                onInput,
                onChange,
                createNewNote,
            };
        },
    };
</script>

<style>
    /* Custom styles for the MenuBar component */
</style>
