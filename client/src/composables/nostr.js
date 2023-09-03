// import { ref } from 'vue';
import { ref,  getCurrentInstance } from 'vue';
import useNDK from '@/composables/useNDK';

export default function useNostrState() {
  const ndk = getCurrentInstance().appContext.config.globalProperties.ndk;
  // const ndk = useNDK();
  const user = ref(null);
  const noteEvents = ref([]);
  const noteEventDetail = ref({});

  async function fetchUser(npub) {
    try {
      if (!ndk) {
        throw new Error('NDK is not initialized');
      }
      
      const userInstance = ndk.getUser({ npub });
      await userInstance.fetchProfile();
      user.value = userInstance;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  async function fetchEvents(settings) {
    try {
      if (!ndk) {
        throw new Error('NDK is not initialized');
      }

      const userInstance = ndk.getUser({ npub: settings?.npub });
      const filter = { kinds: [...settings?.kinds], authors: [userInstance.hexpubkey()] };

      const events = await ndk.fetchEvents(filter);
      noteEvents.value = Array.from(events).map(e => ({
        id: e.id,
        content: e.content,
        kind: e.kind,
        pubkey: e.pubkey,
        url: e.relay?.url,
        sig: e.sig,
        tags: e.tags.flat(),
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  async function subscribeToEvents(settings) {
    try {
      if (!ndk) {
        throw new Error('NDK is not initialized');
      }

      const userInstance = ndk.getUser({ npub: settings?.npub });
      const filter = { kinds: [...settings?.kinds], authors: [userInstance.hexpubkey()] };

      const subscription = await ndk.subscribe(filter);

      subscription.on('event', e => {
        const mappedEvent = {
          id: e.id,
          content: e.content,
          kind: e.kind,
          pubkey: e.pubkey,
          url: e.relay?.url,
          sig: e.sig,
          tags: e.tags.flat(),
        };
        noteEvents.value.push(mappedEvent);
      });

      subscription.on('error', error => {
        console.error("Subscription error:", error);
        fetchEvents(settings);
      });

    } catch (error) {
      console.error("Error subscribing to events:", error);
      throw error;
    }
  }

  function getNoteEventFromState(id) {
    const event = noteEvents.value.find(e => e.id === id);
    if (event) {
      noteEventDetail.value = event;
    }
  }

  async function fetchNoteEventById(eventId) {
    try {
      if (!ndk) {
        throw new Error('NDK is not initialized');
      }

      const event = await ndk.fetchEvent(eventId);
      if (!event) {
        console.error("Event not found:", eventId);
        return;
      }

      noteEventDetail.value = {
        id: event.id,
        content: event.content,
        kind: event.kind,
        pubkey: event.pubkey,
        url: event.relay?.url,
        sig: event.sig,
        tags: event.tags.flat(),
      };
    } catch (error) {
      console.error("Error fetching event detail:", error);
      throw error;
    }
  }

  return {
    user,
    noteEvents,
    noteEventDetail,
    fetchUser,
    fetchEvents,
    subscribeToEvents,
    getNoteEventFromState,
    fetchNoteEventById,
  };
}
