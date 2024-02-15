<template>
    <div class="h-full px-2">
        <div class="mt-4 mb-1">
            <!-- <router-link to="/"> -->
            <!--     <button class="btn btn-primary h-10 mx-2"> -->
            <!--         <font-awesome-icon :icon="['fas', 'angles-left']" /> -->
            <!--     </button> -->
            <!-- </router-link> -->
            <router-link to="/" class="text-xl ml-2">
                <!-- <font-awesome-icon :icon="['fas', 'angles-left']" /> -->
                <font-awesome-icon icon="angles-left" aria-label="back" />
            </router-link>
        </div>
        <div><NoteEventDetail :id="eventId" /></div>
    </div>
</template>

<script>
    import { onMounted, computed } from "vue";
    import { useRouter } from "vue-router";
    import NoteEventDetail from "@/components/NoteEventDetail.vue";

    export default {
        components: {
            NoteEventDetail,
        },
        setup() {
            const router = useRouter();

            const eventId = computed(() => {
                const currentRoute = router.currentRoute.value;
                const params = currentRoute.params;
                const id = params.id;
                return id === "new" ? null : id;
            });

            return {
                eventId,
            };
        },
    };
</script>
