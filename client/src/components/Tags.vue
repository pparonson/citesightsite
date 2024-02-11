<template>
    <div class="">
        <div v-if="keywordTags.length === 0" class="text-gray-500">No tags available.</div>
        <ul v-else class="">
            <li
                v-for="tag in keywordTags"
                :key="tag"
                class="inline-block max-w-xs overflow-hidden text-xs text-ellipsis bg-blue-300 text-white mx-1 px-2 py-1 rounded-md"
            >
                {{ tag }}
                <font-awesome-icon
                    v-if="editable"
                    icon="xmark"
                    class="ml-2 cursor-pointer"
                    @click.stop="$emit('remove', tag)"
                />
            </li>
        </ul>
    </div>
</template>

<script>
    import { computed, defineComponent } from "vue";

    export default defineComponent({
        props: {
            tags: {
                type: Array,
                required: true,
                validator(value) {
                    return value.every((tag) => Array.isArray(tag) && tag.length >= 2 && tag.every(String));
                },
            },
            editable: {
                type: Boolean,
                default: false,
            },
        },
        emits: ["remove"],
        setup(props, context) {
            const keywordTags = computed(() => {
                if (!props.tags) {
                    return [];
                }

                return [...new Set(props.tags.filter(([type]) => type === "t").map((tag) => tag[1]))];
            });

            const emitRemoveTag = (tag) => {
                context.emit("remove", tag);
            };

            return {
                keywordTags,
                emitRemoveTag,
            };
        },
    });
</script>

<style>
    /* Custom styles for the Tags component */
</style>
