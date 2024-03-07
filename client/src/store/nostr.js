import { defineStore } from "pinia";
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import { deriveAESKey, encrypt, decrypt } from "../utils/crypto.js";
import config from "../../config/config.js";

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
            noteEvents: [],
            note: {},
            selectedNote: null,
            isFetchingEvents: true,
        };
    },

    actions: {
        async initializeNDK() {
            localStorage.setItem('debug', 'ndk:*'); // debug NDK internals
            const nip07signer = new NDKNip07Signer();
            ndk = new NDK({
                signer: nip07signer,
                explicitRelayUrls: [
                    "wss://relay.nostr.band", 
                    "wss://relay.damus.io", 
                    // "wss://purplepag.es"
                ],
            });

            try {
                await ndk.connect();
                console.log("NDK Connected..");

                const user = await nip07signer.user();
                if (user?.npub) {
                    console.log("Permission granted to read their public key:", user.npub);
                    this.user = user;
                    await this.fetchUser(user.npub);
                }
            } catch (error) {
                console.error("Error connecting to NDK:", error);
                throw error;
            }
        },
        async fetchUser(npub) {
            try {
                const user = ndk.getUser({ npub });
                await user.fetchProfile();
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
                    console.error("Subscription to note events error:", error);
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
            let isUpdate = note.id ? true : false;

            const { secretBase64, saltBase64, ivBase64 } = config.encryptionCredentials;
            const aesKey = await deriveAESKey(secretBase64, saltBase64);
            const encrypted = await encrypt(aesKey, ivBase64, note.content);

            const eventProperties = await this.handleCreateUpdate({ ...note, content: encrypted.content }, isUpdate);

            eventProperties.tags.push(["encrypted", "1"]);
            eventProperties.tags.push(["ivBase64", encrypted.ivBase64]);

            let event = new NDKEvent(ndk, eventProperties);

            try {
                await ndk.publish(event);
            } catch (error) {
                console.error("Error publishing event:", error);
                throw error;
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
            const isEncrypted = event.tags.some((tag) => tag[0] === "encrypted" && tag[1] === "1");
            if (isEncrypted) {
                try {
                    const { secretBase64, saltBase64, ivBase64 } = config.encryptionCredentials;
                    let aesKey = await deriveAESKey(secretBase64, saltBase64);
                    const decrypted = await decrypt(aesKey, ivBase64, event.content);
                    event.content = decrypted;
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
