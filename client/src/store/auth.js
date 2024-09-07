import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => {
        return {
            showModal: true,
            isLoggedIn: false,
            loginMethod: null, // https://github.com/nostrband/nostr-login
        };
    },
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
        setLoginStatus(status) {
            this.isLoggedIn = status;
        }
    },
});
