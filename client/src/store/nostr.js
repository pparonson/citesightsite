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
            note: {},
            selectedNote: null,
            isFetchingInitialEvents: false,
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
            this.isFetchingInitialEvents = true;
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
                    this.processNoteEvent(event);
                });
                console.log("Fetched and filtered events:", this.noteEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
                throw error;
            } finally {
                this.isFetchingInitialEvents = false;

            }
        },
        async subscribeToEvents(settings) {
            try {
                const filter = { kinds: [...settings?.kinds], authors: [this.user?.hexpubkey] };
                const subscription = await ndk.subscribe(filter);

                subscription.on("event", async (e) => {
                    // debounce if still fetching initial notes
                    if (this.isFetchingInitialEvents) return;
                    const existingEventIndex = this.noteEvents.findIndex((event) => event.id === e.id);
                    const mappedEvent = this.createMappedEvent(e);
                    console.log("Fetched event: ", this.noteEvents);

                    if (existingEventIndex !== -1) {
                        // TODO: subscribeToEvents does not correctly filter latest event independent of fetchEvents
                        const existingVersionTag = this.noteEvents[existingEventIndex].tags.find(
                            (tag) => tag[0] === "v"
                        );
                        const incomingVersionTag = e.tags.find((tag) => tag[0] === "v");
                        if (existingVersionTag && incomingVersionTag && existingVersionTag[1] < incomingVersionTag[1]) {
                            // Incoming event is newer. Update the existing event with new data.
                            this.noteEvents[existingEventIndex] = mappedEvent;
                            console.log("Fetched and filtered event:", mappedEvent);
                        }
                    } else {
                        // It's a new event, add it to the array
                        this.noteEvents.push(mappedEvent);
                    }

                    this.processNoteEvent(mappedEvent);
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

  sortNoteEventsByDateDesc() {
    this.noteEvents.sort((a, b) => {
      // Extract date strings from tags
      const dateATag = a.tags.find(tag => tag[0] === 'd');
      const dateBTag = b.tags.find(tag => tag[0] === 'd');
      
      // Try parsing the dates, invalid dates will become 'Invalid Date'
      const dateA = new Date(dateATag ? dateATag[1] : NaN);
      const dateB = new Date(dateBTag ? dateBTag[1] : NaN);

      // Handle invalid dates by considering them as the largest possible date
      // this ensures they are pushed to the end of the sorted array
      if (isNaN(dateA)) return 1; // a goes after b
      if (isNaN(dateB)) return -1; // a goes before b

      // Compare valid dates in descending order
      return dateB - dateA;
    });
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
            this.sortNoteEventsByDateDesc(); // this is a potentially expensive use of compute
            console.log("Sorted note events by date desc:", this.noteEvents);
        },
        filterToLatestNotes(event) {
            const previousIdTag = event.tags.find((tag) => tag[0] === "e");
            if (previousIdTag) {
                const previousId = previousIdTag[1];
                this.noteEvents = this.noteEvents.filter((e) => e.id !== previousId);
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
        setSelectedNoteById(noteId) {
            const note = this.noteEvents.find(n => n.id === noteId);
            this.selectedNote = note ? { ...note } : null;
        }
    },
});
