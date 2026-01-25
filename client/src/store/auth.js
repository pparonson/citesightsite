import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => {
        return {
            showModal: true,
            isLoggedIn: false,
            loginMethod: 'nostr-login', // https://github.com/nostrband/nostr-login
            userNpub: null,
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
        },
        setUserNpub(npub) {
            this.userNpub = npub;
        },
        logout() {
            // Dispatch nlLogout event to nostr-login
            document.dispatchEvent(new Event("nlLogout"));
            this.isLoggedIn = false;
            this.userNpub = null;
        }
    },
});
