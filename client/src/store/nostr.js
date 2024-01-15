import { defineStore } from "pinia";
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";

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
            latestNotes: {},
            note: {},
        };
    },

    actions: {
        async initializeNDK() {
            const nip07signer = new NDKNip07Signer();
            ndk = new NDK({
                signer: nip07signer,
                explicitRelayUrls: ["wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es"],
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
                this.user = user;
                // return user; // Return the fetched user profile
            } catch (error) {
                console.error("Error fetching user:", error);
                throw error; // Throw the error to be caught by the caller
            }
        },

        async fetchEvents(settings) {
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const events = await ndk.fetchEvents(filter);
                const eventsArray = Array.from(events);
                eventsArray.forEach((event) => {
                    const mappedEvent = this.createMappedEvent(event);
                    this.noteEvents.push(mappedEvent);
                });

                console.log("Fetched events:", this.noteEvents);
                this.noteEvents.forEach((event) => {
                    const mappedEvent = this.createMappedEvent(event);
                    this.processNoteEvent(mappedEvent);
                });
                console.log("Fetched and filtered events:", this.noteEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
                throw error;
            }
        },

        async subscribeToEvents(settings) {
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const subscription = await ndk.subscribe(filter);
                let mappedEvent;
                // subscription.on("event", async (e) => {
                //     mappedEvent = {
                //         ...e,
                //         id: e.id,
                //         created_at: e.created_at,
                //         content: e.content,
                //         kind: e.kind,
                //         pubkey: e.pubkey,
                //         url: e.relay?.url,
                //         sig: e.sig,
                //         tags: e.tags,
                //     };
                //
                //     this.noteEvents.push(mappedEvent);
                // });

                subscription.on("error", (error) => {
                    console.error("Subscription error:", error);
                    // Handle subscription errors here, e.g., reconnect or notify the user
                    // For example, you can dispatch the fetchEvents action as a fallback mechanism
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
                    console.error("Event not found:", eventId);
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

                this.note = JSON.parse(JSON.stringify(mappedEvent));
                return this.note;
            } catch (error) {
                console.error("Error fetching event detail:", error);
                throw error;
            }
        },

        async publishEvent(note) {
            let isUpdate = note.id ? true : false;
            const eventProperties = await this.handleCreateUpdate(note, isUpdate);
            let event = new NDKEvent(ndk, eventProperties);

            try {
                // Publish the event and update local state
                const published = await ndk.publish(event);
                console.log(`Published: ${JSON.stringify(published, null, 2)}`);

                // method to update the notes array
                this.updateNoteEvents(note, published.id, isUpdate);
            } catch (error) {
                console.error("Error publishing event:", error);
                throw error;
            }
        },
        async handleCreateUpdate(note, isUpdate) {
            // const title = isUpdate ? note.title : getCurrentDate();
            const title = getCurrentDate();

            const baseTags = [
                ["title", title],
                ["t", "note"],
                ["t", "test"],
                ["t", "example"],
                ["t", "sample_tag"],
                ["d", title],
            ];
            let version = "1";
            let eventId = null;

            // If it's an update, fetch the previous event
            if (isUpdate && note.id) {
                const prevNote = await this.fetchNoteEventById(note.id);
                if (prevNote) {
                    const versionTag = prevNote.tags.find((tag) => tag[0] === "v");
                    version = versionTag ? String(Number(versionTag[1]) + 1) : "2";
                    eventId = prevNote.id;
                }
            }

            // Tags specific to updates or new notes
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
                tags: [...baseTags, ...specificTags],
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
        processNoteEvent(event) {
            this.filterToLatestNotes(event);

        },
        filterToLatestNotes(event) {
            const previousIdTag = event.tags.find((tag) => tag[0] === "e");
            if (previousIdTag) {
                const previousId = previousIdTag[1];
                    this.noteEvents = this.noteEvents.filter(e => e.id !== previousId);
            }
        },
        updateNoteEvents(note, newId, isUpdate) {
            const updatedNote = { ...note, id: newId };

            if (isUpdate) {
                const index = this.noteEvents.findIndex((e) => e.id === note.id);
                if (index !== -1) {
                    this.noteEvents[index] = updatedNote;
                }
            } else {
                this.noteEvents.push(updatedNote);
            }
        },
    },
});
