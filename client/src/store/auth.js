import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        showModal: true,
        isLoggedIn: false,
        loginMethod: null, // 'NIP07' or 'NIP46'
    }),
    actions: {
        toggleModal(show = null) {
            if (show !== null) {
                this.showModal = show;
            } else {
                this.showModal = !this.showModal;
            }
        },
        setLoginMethod(method) {
            this.loginMethod = method;
        },
    },
});
