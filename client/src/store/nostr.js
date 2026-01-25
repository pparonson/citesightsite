import { defineStore } from "pinia";
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import { launch } from "nostr-login";
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
            follows: [],
            followsEvents: [],
            noteEvents: [],
            note: {},
            selectedEvent: null,
            isFetchingEvents: true,
            isPublishingEvent: false,
            missingEncryptionKey: false,
            missingOptionalCredentials: false,
        };
    },

    actions: {
        async initializeNDK(skipLaunch = false) {
            const authStore = useAuthStore();
            let { loginMethod, toggleModal, setLoginStatus } = authStore;
            let signer;
            
            try {
                if (!ndk) {
                    ndk = new NDK();
                }
                
                if (loginMethod === "nostr-login") {
                    // If not skipping launch (e.g., called from LOGIN button), show the dialog
                    // If skipLaunch is true (called from nlAuth event), user is already authenticated
                    if (!skipLaunch) {
                        await launch({ 
                            startScreen: 'login-bunker-url'
                        });
                    }

                    // nostr-login provides window.nostr, use NDKNip07Signer
                    if (window.nostr) {
                        signer = new NDKNip07Signer();
                    } else {
                        throw new Error('Nostr Login not initialized - window.nostr not available');
                    }
                } else {
                    throw new Error(`Unsupported login method: ${loginMethod}`);
                }

                const user = await signer.user();
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

                    ndk = new NDK({ signer, explicitRelayUrls });
                    
                    // Don't block on connect - let it happen in background
                    // NDK will automatically retry failed connections
                    ndk.connect().catch((err) => {
                        console.error("NDK connect error:", err);
                    });

                    const resp = await this.fetchUser(user.npub);
                    if (resp) {
                        setLoginStatus(true);
                        toggleModal(false);
                    }
                }
            } catch (error) {
                console.error("Error connecting to NDK:", error);
                throw error;
            }
        },
        async fetchUser(npub) {
            try {
                const user = ndk.getUser({ npub });
                return (this.user = user);
            } catch (error) {
                console.error("Error fetching user:", error);
                throw error;
            }
        },
        async fetchUserFollows() {
            if (!this.user?.hexpubkey) {
                console.warn("fetchUserFollows: user.hexpubkey is undefined, skipping fetch");
                return [];
            }
            const filter = {
                kinds: [3], // Kind 3 represents follows
                authors: [this.user.hexpubkey]
            };
            const events = await ndk.fetchEvents(filter);
            const eventsArray = Array.from(events);
            return eventsArray.map(event => event.tags?.map(tag => tag[1]))?.flat();
        },
        async fetchFollowsEvents() {
            this.follows = await this.fetchUserFollows();
            for (const author of this.follows) {
                const filter = { kinds: [30023], authors: [author] }; // Kind 30023 is a public long-form note
                const events = await ndk.fetchEvents(filter);
                const eventsArray = Array.from(events);

                for (const event of eventsArray) {
                    const mappedEvent = this.createMappedEvent(event);
                    const existingEventIndex = this.followsEvents.findIndex((e) => e.id === mappedEvent.id);
                    if (existingEventIndex === -1) {
                        this.followsEvents.push(mappedEvent);
                    } 
                }
            }
        },
        async fetchEvents(settings) {
            this.isFetchingEvents = true;
            try {
                if (!this.user?.hexpubkey) {
                    console.warn("fetchEvents: user.hexpubkey is undefined, skipping fetch");
                    return [];
                }
                const filter = { kinds: [...settings?.kinds], authors: [this.user.hexpubkey] };
                const events = await ndk.fetchEvents(filter);
                const eventsArray = Array.from(events);

                for (const event of eventsArray) {
                    const mappedEvent = this.createMappedEvent(event);
                    await this.processNoteEvent(mappedEvent);
                }
                for (const event of this.noteEvents) {
                    this.filterToLatestNotes(event);
                }
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
                if (!this.user?.hexpubkey) {
                    console.warn("subscribeToEvents: user.hexpubkey is undefined, skipping subscription");
                    return;
                }
                const filter = { kinds: [...settings?.kinds], authors: [this.user.hexpubkey] };
                const subscription = await ndk.subscribe(filter);

                subscription.on("event", async (e) => {
                    // debounce if still fetching initial notes
                    if (this.isFetchingEvents) return;
                    const mappedEvent = this.createMappedEvent(e);
                    await this.processNoteEvent(mappedEvent);
                    for (const event of this.noteEvents) {
                        this.filterToLatestNotes(event);
                    }
                });

                subscription.on("error", (error) => {
                    console.error("Error: Subscription to note events failed:", error);
                    // this.fetchEvents(settings);
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
                    throw new Error(`Event not found: ${eventId}`);
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
                console.warn("No user data found in IndexedDB. Cannot encrypt event.");
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
            
            let ndkEvent = new NDKEvent(ndk, eventProperties);
            
            // Ensure the event has a valid pubkey before publishing
            if (!ndkEvent.pubkey && this.user && this.user.hexpubkey) {
                ndkEvent.pubkey = this.user.hexpubkey;
            }
            
            // Check if event is valid before attempting to publish
            if (!ndkEvent.pubkey) {
                throw new Error("Cannot publish event: Missing pubkey. User may not be properly authenticated.");
            }

            try {
                // Add timeout to prevent hanging
                const publishPromise = ndk.publish(ndkEvent);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Publish operation timed out after 20 seconds")), 20000);
                });
                
                await Promise.race([publishPromise, timeoutPromise]);
            } catch (error) {
                console.error("Error publishing event:", error);
                throw error;
            } finally {
                this.isPublishingEvent = false;
            }
        },
        async handleCreateUpdate(note, isUpdate) {
            // if update, get prevNote and if create, set as null
            let prevNote = null;
            
            if (note.id) {
                try {
                    prevNote = await this.fetchNoteEventById(note.id);
                } catch (error) {
                    console.warn(`Could not fetch previous note with ID ${note.id}. Creating as new note.`, error);
                    // Continue with null prevNote, effectively treating this as a new note
                    isUpdate = false;
                }
            }
            
            // If prevNote is null or undefined, use current date as title
            let title = getCurrentDate();
            
            // If we have a valid prevNote with a title tag, use that title
            if (isUpdate && prevNote && prevNote.tags) {
                const titleTag = prevNote.tags.find((tag) => tag[0] === "title");
                if (titleTag) {
                    title = String(titleTag[1]);
                }
            }

            let baseTags = [
                ["title", title],
                ["d", title],
            ];

            let version = "1";
            let eventId = null;
            let tags = [];
            note?.tags?.forEach((tag) => {
                if (tag[0] === "t") {
                    tags.push([tag[0], tag[1]]);
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
                kind: note.kind,
                content: note.content,
                tags: [...baseTags, ...specificTags, ...tags],
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
                console.warn("No user data found in IndexedDB. Cannot decrypt event.");
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
                    this.setSelectedEvent(event);
                }
            } else {
                this.noteEvents.push(event);
                this.setSelectedEvent(event);
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
        setSelectedEvent(event) {
            this.selectedEvent = event;
        }
    },
});
