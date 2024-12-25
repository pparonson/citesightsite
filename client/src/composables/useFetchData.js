// src/composables/useFetchData.js  // TODO: Not yet implemented
import { ref, watch, onMounted } from 'vue';
import { useNostrStore } from '@/store/nostr';
import { useAnnotationStore } from '@/store/annotation';
import { useAuthStore } from '@/store/auth';

export default function useFetchData() {
     const nostrStore = useNostrStore();
     const annotationStore = useAnnotationStore();
     const authStore = useAuthStore();
     const { isLoggedIn } = authStore;

     const isFetchingData = ref(false);
     const error = ref(null);

     const fetchAnnotationsAndEvents = async () => {
       if (isLoggedIn.value) {
         isFetchingData.value = true;
         error.value = null;

         const settings = { kinds: [nostrStore.kind] };

         try {
           await Promise.all([
             nostrStore.fetchEvents(settings),
             nostrStore.fetchFollowsEvents(),
             annotationStore.fetchAllAnnotations(),
             nostrStore.subscribeToEvents(settings),
           ]);
         } catch (err) {
           console.error('Error fetching data:', err);
           error.value = err;
         } finally {
           isFetchingData.value = false;
         }
       }
     };

     onMounted(fetchAnnotationsAndEvents);

     watch(isLoggedIn, (loggedIn) => {
       if (loggedIn) {
         fetchAnnotationsAndEvents();
       }
     });

     return { isFetchingData, error };
}
