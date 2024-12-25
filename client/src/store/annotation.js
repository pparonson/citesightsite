import { defineStore } from "pinia";
import config from "./../../config/config";
import { useIndexedDB } from "@/utils/indexedDB";
import { useNostrStore } from "./nostr";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useAnnotationStore = defineStore("annotation", {
    state: () => {
        return {
            annotations: [],
            annotation: {},
        };
    },
    actions: {
        async fetchAllAnnotations() {

     const { annotApiEndpoint, rateLimitMs } = config.connections.annotation;
     let userFilter = null;
     let apiKey = null;

     const nostrStore = useNostrStore();
     const { user } = nostrStore;

     try {
       const userData = await useIndexedDB().get(user.npub);
       if (!userData) {
         console.log("No user data found in IndexedDB. Cannot fetch annotations.");
         return;
       } else {
         userFilter = userData.encryptedAnnotAPIAcct;
         apiKey = userData.encryptedAnnotAPIKey;
       }
     } catch (error) {
       console.error(`Error fetching user data: ${error}`);
     }

     let searchAfter = null;
     const headers = {
       Authorization: `Bearer ${apiKey}`,
       Accept: "application/vnd.hypothesis.v1+json",
     };

     if (!userFilter || !apiKey) {
       console.log("Annotations is not configured..");
     } else {
       let hasMore = true;
       do {
         let url = `${annotApiEndpoint}?user=${userFilter}&sort=updated`;
         if (searchAfter) {
           url += "&search_after=" + encodeURIComponent(searchAfter);
         }

         const response = await fetch(url, { method: "GET", headers });
         if (!response.ok) {
           throw new Error(`Error fetching annotations: ${response.statusText}`);
         }

         const data = await response.json();
         if (data.rows && data.rows.length > 0) {
           const uniqueAnnotations = [...new Map([...this.annotations, ...data.rows].map(item => [item.id, item])).values()];
           this.annotations = uniqueAnnotations;
           searchAfter = data.rows[data.rows.length - 1].updated;
         } else {
           hasMore = false;
         }

         // Rate limit
         await sleep(rateLimitMs);
       } while (hasMore);

       return this.annotations;
     }
        },
    },
});
