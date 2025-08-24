import { defineStore } from "pinia";
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
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
        async initializeNDK() {
            // localStorage.setItem("debug", "ndk:*"); // TODO: TESTING debug NDK internals
            const authStore = useAuthStore();
            let { loginMethod, toggleModal, setLoginStatus } = authStore;
            let signer;
            let remoteNpub;
            try {
                if (!ndk) {
                    ndk = new NDK();
                }
                if (loginMethod === "nostr-login") {
                    // Wait for window.nostr to be available (with timeout)
                    const waitForNostr = async (maxWaitTime = 5000) => {
                        console.log("Waiting for window.nostr to be available...");
                        
                        if (window.nostr) {
                            console.log("window.nostr is already available");
                            return true;
                        }
                        
                        return new Promise((resolve) => {
                            const checkInterval = 100; // Check every 100ms
                            let elapsedTime = 0;
                            
                            const intervalId = setInterval(() => {
                                elapsedTime += checkInterval;
                                
                                if (window.nostr) {
                                    console.log("window.nostr became available");
                                    clearInterval(intervalId);
                                    resolve(true);
                                } else if (elapsedTime >= maxWaitTime) {
                                    console.error(`Timed out after ${maxWaitTime}ms waiting for window.nostr`);
                                    clearInterval(intervalId);
                                    resolve(false);
                                }
                            }, checkInterval);
                        });
                    };
                    
                    // Wait for window.nostr to be available
                    const nostrAvailable = await waitForNostr();
                    
                    if (nostrAvailable) {
                        console.log("Using window.nostr for authentication");
                        signer = new NDKNip07Signer();
                    } else {
                        console.error("No Nostr provider found. Please install a Nostr extension or enable window.nostr.js");
                        
                        // Try to manually trigger window.nostr.js if it's not already initialized
                        if (typeof window.wnParams !== 'undefined') {
                            console.log("window.wnParams is defined, attempting to manually initialize window.nostr.js");
                            // This might help trigger window.nostr.js initialization
                            const scriptEl = document.createElement('script');
                            scriptEl.src = 'https://cdn.jsdelivr.net/npm/window.nostr.js/dist/window.nostr.min.js';
                            document.head.appendChild(scriptEl);
                            
                            // Wait again after attempting to reinitialize
                            const retryNostrAvailable = await waitForNostr(3000);
                            
                            if (retryNostrAvailable) {
                                console.log("window.nostr became available after retry");
                                signer = new NDKNip07Signer();
                            } else {
                                throw new Error('No Nostr provider found after retry');
                            }
                        } else {
                            throw new Error('No Nostr provider found');
                        }
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

                    // Create a new NDK instance with the signer
                    ndk = new NDK({
                        explicitRelayUrls,
                        signer,
                    });
                    
                    // Ensure the signer is properly set
                    if (!ndk.signer) {
                        console.error("NDK signer not properly set");
                        ndk.signer = signer;
                    }
                    
                    await ndk.connect();
                    console.log("NDK Connected..", ndk);

                    await this.fetchUser(user.npub);
                    if (this.user) {
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
                return (this.user = user);
            } catch (error) {
                console.error("Error fetching user:", error);
                throw error;
            }
        },
        async fetchUserFollows() {
            const filter = {
                kinds: [3], // Kind 3 represents follows
                authors: [this.user?.hexpubkey]
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
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
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
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
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
                console.log(`Attempting to fetch event with ID: ${eventId}`);
                const event = await ndk.fetchEvent(eventId);
                
                if (!event) {
                    console.error("Event not found:", eventId);
                    throw new Error(`Event not found: ${eventId}`);
                }

                console.log(`Successfully fetched event:`, event);
                
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
                
                // More detailed error logging
                if (error.message && error.message.includes("not found")) {
                    console.error(`The event with ID ${eventId} could not be found. This may happen if the event was recently created and hasn't propagated to the relays yet.`);
                } else if (error.message) {
                    console.error(`Specific error message: ${error.message}`);
                }
                
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
            
            let ndkEvent = new NDKEvent(ndk, eventProperties);
            
            // Ensure the event has a valid pubkey before publishing
            if (!ndkEvent.pubkey && this.user && this.user.hexpubkey) {
                console.log("Setting pubkey on event:", this.user.hexpubkey);
                ndkEvent.pubkey = this.user.hexpubkey;
            }
            
            // Check if event is valid before attempting to publish
            if (!ndkEvent.pubkey) {
                console.error("Cannot publish event: Missing pubkey");
                throw new Error("Cannot publish event: Missing pubkey. User may not be properly authenticated.");
            }

            try {
                // Add timeout to prevent hanging
                const publishPromise = ndk.publish(ndkEvent);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Publish operation timed out after 10 seconds")), 20000);
                });
                
                await Promise.race([publishPromise, timeoutPromise]);
            } catch (error) {
                console.error("Error publishing event:", error);
                
                // More detailed error logging
                if (error.message && error.message.includes("Keys not responding")) {
                    console.error("Nostr signer error: Keys not responding. This may be due to nsec.app not responding to signing requests.");
                    console.error("Check if nsec.app is accessible and that you have granted the necessary permissions.");
                } else if (error.message) {
                    console.error(`Specific error message: ${error.message}`);
                }
                
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
            console.log("Selected event:", event);
            this.selectedEvent = event;
        }
    },
});
