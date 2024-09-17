import { defineStore } from "pinia";
import NDK, { NDKNip46Signer, NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import { init as initNostrLogin, launch as launchNostrLoginDialog } from "nostr-login";
import { nip44 } from "nostr-tools";
import { useIndexedDB } from "@/utils/indexedDB";
import { useAuthStore } from "@/store/auth";

let ndk;

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // January is 0
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export const useNostrStore = defineStore("nostr", {
    state: () => {
        return {
            user: null,
            signer: null,
            noteEvents: [],
            note: {},
            selectedNote: null,
            isFetchingEvents: true,
            isPublishingEvent: false,
            missingEncryptionKey: false,
            missingOptionalCredentials: false,
        };
    },

    actions: {
        async initializeNDK() {
            localStorage.setItem("debug", "ndk:*"); // TODO: TESTING debug NDK internals
            const authStore = useAuthStore();
            let { loginMethod, toggleModal, setLoginStatus } = authStore;
            // let signer;
            let remoteNpub;
            try {
                if (!ndk) {
                    ndk = new NDK();
                }
                if (loginMethod === "nostr-login") {
                    try {
                        await initNostrLogin({
                            bunkers: 'nsec.app',
                            theme: 'ocean',
                            darkMode: true,
                            perms: 'sign_event:1, nip04_encrypt',
                            noBanner: true,
                            isSignInWithExtension: false, // TODO: not working as expected
                            onAuth: async (npub, options) => {
                                console.log(`User authenticated with pubkey: ${npub}`, options);
                                remoteNpub = npub;
                            },
                        }).catch((ex) => {
                            console.error('Error initializing Nostr Login:', ex);
                        });
                    } catch (ex) {
                        console.error('Error initializing Nostr Login:', ex);
                    }

                    await launchNostrLoginDialog({ 
                        startScreen: 'login-bunker-url' // TODO: Not workng as expected
                    });

                    if (window.nostr) {
                        this.signer = new NDKNip07Signer();
                        // this.signer = new NDKNip46Signer(ndk, remoteNpub, window.nostr);
                    } else {
                        throw new Error('Nostr Login not initialized');
                    }

                } else {
                    throw new Error(`Unsupported login method: ${loginMethod}`);
                }

                const user = await this.signer.user();
                if (user?.npub) {
                    const userData = await useIndexedDB().get(user.npub || "");
                    if (userData) {
                        if (!userData.encryptionKey) {
                            this.missingEncryptionKey = true;
                        }  
                        if (
                            !userData.encryptedAnnotAPIAcct || 
                            !userData.encryptedAnnotAPIKey || 
                            !userData.relayUrls || 
                            userData.relayUrls.length === 0
                        ) {
                            const missingOptionalCredentials = !userData.encryptedAnnotAPIAcct || 
                                !userData.encryptedAnnotAPIKey 
                                || !userData.relayUrls 
                                || userData.relayUrls.length === 0;

                            if (missingOptionalCredentials) {
                                this.missingOptionalCredentials = true;
                            }
                        }
                    } else {
                        this.missingEncryptionKey = true;
                    }

                    const explicitRelayUrls = userData?.relayUrls?.length ? userData.relayUrls : [];

                    ndk = new NDK({ explicitRelayUrls, signer: this.signer });
                    await ndk.connect();
                    console.log("NDK Connected..");

                    const resp = await this.fetchUser(user.npub);
                    if (resp) {
                        setLoginStatus(true);
                        toggleModal(false);
                    }
                }
            }catch (error) {
                console.error("Error connecting to NDK:", error);
                throw error;
            }
        },
        async fetchUser(npub) {
            try {
                const user = ndk.getUser({ npub });
                // let profile = await user.fetchProfile();
                return (this.user = user);
            } catch (error) {
                console.error("Error fetching user:", error);
                throw error;
            }
        },
        async fetchEvents(settings) {
            this.isFetchingEvents = true;
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const events = await ndk.fetchEvents(filter);
                const eventsArray = Array.from(events);

                for (const event of eventsArray) {
                    const mappedEvent = this.createMappedEvent(event);
                    await this.processNoteEvent(mappedEvent);
                }
                this.sortNoteEventsByDateTag();
            } catch (error) {
                console.error("Error fetching events:", error);
                throw error;
            } finally {
                this.isFetchingEvents = false;
                return this.noteEvents;
            }
        },
        async subscribeToEvents(settings) {
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const subscription = await ndk.subscribe(filter);

                subscription.on("event", async (e) => {
                    // debounce if still fetching initial notes
                    if (this.isFetchingEvents) return;
                    const mappedEvent = this.createMappedEvent(e);
                    await this.processNoteEvent(mappedEvent);
                    this.sortNoteEventsByDateTag();
                });

                subscription.on("error", (error) => {
                    console.error("Error: Subscription to note events failed:", error);
                    this.fetchEvents(settings);
                });
            } catch (error) {
                console.error("Error subscribing to events:", error);
                throw error;
            }
        },
        getNoteEventFromState(id) {
            const event = this.noteEvents.find((e) => e.id === id);
            if (event) {
                this.note = JSON.parse(JSON.stringify(event));
            }
        },
        async fetchNoteEventById(eventId) {
            try {
                const event = await ndk.fetchEvent(eventId);
                if (!event) {
                    console.error("Error event not found:", eventId);
                    return;
                }

                let mappedEvent = {
                    id: event.id,
                    content: event.content,
                    kind: event.kind,
                    pubkey: event.pubkey,
                    url: event.relay?.url,
                    sig: event.sig,
                    tags: event.tags,
                };

                return (this.note = await this.processNoteEvent(mappedEvent));
            } catch (error) {
                console.error("Error fetching event detail:", error);
                throw error;
            }
        },
        async publishEvent(note) {
            this.isPublishingEvent = true;
            let isUpdate = note.id ? true : false;
            let encryptionKey = ""; 
            const userData = await useIndexedDB().get(this.user.npub);
            if (!userData) {
                console.log("No user data found in IndexedDB. Cannot encrypt event.");
                return;
            } else {
                encryptionKey = userData.encryptionKey;
            }

            let encrypted;
            try {
                // Encrypt the event using NIP-44
                encrypted = nip44.v2.encrypt(note.content, encryptionKey);
            } catch (error) {
                console.error("Error: Failed to encrypt event content: ", error.message);
            } 

            const eventProperties = await this.handleCreateUpdate({ ...note, content: encrypted }, isUpdate);
            eventProperties.tags.push(["encrypted", "1"]);
            // eventProperties.created_at = Math.floor(Date.now() / 1000);
            
            let ndkEvent = new NDKEvent(ndk, eventProperties);
            // ndkEvent = {...ndkEvent, ...eventProperties};

            try {
                // const signedEvent = await window.nostr.signEvent(event);
                const signedEvent = await ndk.publish(ndkEvent);
                // const signedEvent = await ndkEvent.publish();
                console.log("Signed Event: ", signedEvent);
            } catch (error) {
                console.error("Error publishing event:", error);
                throw error;
            } finally {
                this.isPublishingEvent = false;
            }
        },
        sortNoteEventsByDateTag() {
            const noteEventsCopy = JSON.parse(JSON.stringify(this.noteEvents));
            for (const event of noteEventsCopy) {
                this.filterToLatestNotes(event);
            }
            this.noteEvents.sort((a, b) => {
                // Extract date strings from tags
                const dateATag = a.tags.find((tag) => tag[0] === "d");
                const dateBTag = b.tags.find((tag) => tag[0] === "d");

                // Try parsing the dates, invalid dates will become 'Invalid Date'
                // const dateA = new Date(dateATag ? dateATag[1] : NaN);
                // const dateB = new Date(dateBTag ? dateBTag[1] : NaN);

                const dateA = a.created_at ? a.created_at : NaN;
                const dateB = b.created_at ? b.created_at : NaN;

                // Handle invalid dates by considering them as the largest possible date
                // this ensures they are pushed to the end of the sorted array
                if (isNaN(dateA)) return 1; // a goes after b
                if (isNaN(dateB)) return -1; // a goes before b

                // Compare valid dates in descending order
                return dateB - dateA;
            });
        },
        async handleCreateUpdate(note, isUpdate) {
            // if update, get prevNote and if create, set as null
            const prevNote = note.id ? await this.fetchNoteEventById(note.id) : null;
            let title =
                isUpdate && prevNote?.tags?.find((tag) => tag[0] === "title")
                    ? String(prevNote.tags.find((tag) => tag[0] === "title")[1])
                    : getCurrentDate();

            let baseTags = [
                ["title", title],
                ["d", title],
            ];

            let version = "1";
            let eventId = null;
            let userTags = [];
            note?.tags?.forEach((tag) => {
                if (tag[0] === "t") {
                    userTags.push([tag[0], tag[1]]);
                }
            });

            if (isUpdate && prevNote) {
                const versionTag = prevNote.tags.find((tag) => tag[0] === "v");
                version = versionTag ? String(Number(versionTag[1]) + 1) : "2";
                eventId = prevNote.id;
            }

            const specificTags = [
                ["v", version],
                ["isUpdated", isUpdate ? "true" : "false"],
            ];

            if (eventId) {
                specificTags.push(["e", eventId]);
            }

            return {
                kind: note.kind || 1,
                content: note.content,
                tags: [...baseTags, ...specificTags, ...userTags],
            };
        },
        createMappedEvent(event) {
            return {
                id: event.id,
                created_at: event.created_at,
                content: event.content,
                kind: event.kind,
                pubkey: event.pubkey,
                url: event.relay?.url,
                sig: event.sig,
                tags: event.tags,
            };
        },
        async processNoteEvent(event) {
            let encryptionKey = ""; 
            const userData = await useIndexedDB().get(this.user.npub);
            if (!userData) {
                console.log("No user data found in IndexedDB. Cannot encrypt event.");
                return;
            } else {
                encryptionKey = userData.encryptionKey;
            }

            const isEncrypted = event.tags.some((tag) => tag[0] === "encrypted" && tag[1] === "1");
            if (isEncrypted) {
                try {
                    // Decrypt the event using NIP-44
                    const decrypted = nip44?.v2?.decrypt(event.content, encryptionKey);
                    event = { ...event, content: decrypted };
                } catch (error) {
                    console.error("Error: Failed to decrypt event content: ", error);
                }
            }

            const existingEventIndex = this.noteEvents.findIndex((e) => e.id === event.id);

            if (existingEventIndex !== -1) {
                const existingVersionTag = this.noteEvents[existingEventIndex].tags.find((tag) => tag[0] === "v");
                const incomingVersionTag = event.tags.find((tag) => tag[0] === "v");
                if (existingVersionTag && incomingVersionTag && existingVersionTag[1] < incomingVersionTag[1]) {
                    // Incoming event is newer. Update the existing event with new data.
                    this.noteEvents[existingEventIndex] = event;
                }
            } else {
                this.noteEvents.push(event);
            }

            return event;
        },
        filterToLatestNotes(event) {
            const previousIdTag = event.tags.find((tag) => tag[0] === "e");
            if (previousIdTag) {
                const previousId = previousIdTag[1];
                this.noteEvents = this.noteEvents.filter((e) => e.id !== previousId);
            }
        },
        setSelectedNoteById(noteId) {
            const note = this.noteEvents.find((n) => n.id === noteId);
            this.selectedNote = note ? { ...note } : null;
        },
    },
});
