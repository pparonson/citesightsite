<template>
    <div id="app">
        <RouterView />
    </div>
    <AuthModal :show="showAuthModal" />
</template>

<script setup>
    import { computed } from 'vue';
    import { RouterView } from "vue-router";
    import AuthModal from './components/AuthModal.vue';
    import { useAuthStore } from './store/auth';

    const authStore = useAuthStore();

    const showAuthModal = computed(() => authStore.showModal);
</script>

<style>
    /* Add your global styles here */
</style>
