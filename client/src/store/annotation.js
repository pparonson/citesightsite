import { defineStore } from "pinia";
import config from "./../../config/config";


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const useAnnotationStore = defineStore("annotation", {
    state: () => {
        return {
            annotations: [],
            annotation: {},
        };
    },
    actions: {
        async fetchAllAnnotations(username = null, accessToken = null) {
            const { annotApiEndpoint, rateLimitMs } = config.connections.annotation;
            const userFilter = import.meta.env.VITE_ANNOT_USER_FILTER;
            const apiKey = import.meta.env.VITE_ANNOT_API_KEY;

            let searchAfter = null;

            const headers = {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            };

            while (true) {
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
                    this.annotations = this.annotations.concat(data.rows);
                    searchAfter = data.rows[data.rows.length - 1].updated; // Assuming 'updated' field is used for pagination
                } else {
                    break;
                }

                // Rate limit - wait for specified milliseconds
                await sleep(rateLimitMs);
            }

            return this.annotations;
        },

        // async fetchAllAnnotations() {
        //     const API_ENDPOINT = config.connections.annotation.annotApiEndpoint;
        //     const USER_FILTER = import.meta.env.VITE_ANNOT_USER_FILTER;
        //     const apiKey = import.meta.env.VITE_ANNOT_API_KEY;
        //     let offset = 0;
        //     let hasMore = true;

        //     while (hasMore) {
        //         try {
        //             const response = await fetch(`${API_ENDPOINT}?user=${USER_FILTER}&offset=${offset}`, {
        //                 method: "GET",
        //                 headers: {
        //                     Authorization: `Bearer ${apiKey}`,
        //                 },
        //             });

        //             if (!response.ok) {
        //                 throw new Error(`HTTP error! status: ${response.status}`);
        //             }

        //             const data = await response.json();
        //             this.annotations = this.annotations.concat(data.rows);

        //             // Check if there are more results to fetch
        //             hasMore = data.rows.length > 0;
        //             offset += data.rows.length;

        //             // Add delay to respect rate limits
        //             await new Promise((resolve) => setTimeout(resolve, 100));
        //         } catch (error) {
        //             console.error("Error fetching annotations:", error);
        //             break;
        //         }
        //     }

        //     return this.annotations;
        // },
    },
});
