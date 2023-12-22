import { defineStore } from "pinia";
import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";

let ndk;
export const useNostrStore = defineStore("nostr", {
    state: () => {
        return {
            user: null,
            noteEvents: [],
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

                let events = await ndk.fetchEvents(filter);
                this.noteEvents = Array.from(events).map((e) => {
                    let mappedEvent = {
                        id: e.id,
                        content: e.content,
                        kind: e.kind,
                        pubkey: e.pubkey,
                        url: e.relay?.url,
                        sig: e.sig,
                        tags: e.tags.flat(),
                    };

                    return mappedEvent;
                });
                console.log("Fetched events:", this.noteEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
                throw error; // Throw the error to be caught by the caller
            }
        },

        async subscribeToEvents(settings) {
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const subscription = await ndk.subscribe(filter);
                let mappedEvent;
                subscription.on("event", async (e) => {
                    mappedEvent = {
                        id: e.id,
                        content: e.content,
                        kind: e.kind,
                        pubkey: e.pubkey,
                        url: e.relay?.url,
                        sig: e.sig,
                        tags: e.tags.flat(),
                    };

                    this.noteEvents.push(mappedEvent);
                });

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
                // this.note = {...event};
                this.note = JSON.parse(JSON.stringify(event));
                console.log("After update from getNoteEventFromState:", JSON.stringify(this.note));
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
                    tags: event.tags.flat(),
                };

                // In your store's action
                // this.note = {...mappedEvent};
                this.note = JSON.parse(JSON.stringify(mappedEvent));
                console.log("After update from fetchNoteEventById:", JSON.stringify(this.note));
            } catch (error) {
                console.error("Error fetching event detail:", error);
                throw error; // Throw the error to be caught by the caller
            }
        },

        async publishEvent(note, parentId) {
            let event = new NDKEvent(ndk);
            let id;

            event.kind = note.kind || 1;
            event.content = note?.content;

            event.tags = [
                ["d", "lorem-ipsum"],
                ["title", "Lorem Ipsum"],
                ["t", "placeholder", "client", "note"],
                ["parentId", ""],
                [
                    "history",
                    "67729dcd451a81bf36667de75ea71db3e65ca4c18bfe37a3c76afeb7eea8ffb3",
                    "695414cc893ee0b9f0d9dc67106f8717683d1658b0efc48e34f7732ad91a699d",
                ],
                ["isTrashed", "false"],
                ["isDeleted", "false"],
            ];

            if (note.id) {
                id = note.id;

                // Find the index of the sub-array with "history" as the first element
                const historyIndex = event.tags.findIndex((tag) => tag[0] === "history");

                // If found, insert the new item at the second position in the "history" sub-array
                if (historyIndex !== -1) {
                    event.tags[historyIndex].splice(1, 0, id);
                }
            }

            console.log(event.tags);

            let published = await ndk.publish(event);
            console.log(`Published: ${(published, null, 2)}`);
        },
    },
});
