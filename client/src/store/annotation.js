import { defineStore } from "pinia";
import config from "./../../config/config";

export const useAnnotationStore = defineStore("annotation", {
    state: () => {
        return {
            annotations: [],
            annotation: {},
        };
    },

    actions: {
        async fetchAllAnnotations() {
            const API_ENDPOINT = config.connections.annotation.annotApiEndpoint;
            const USER_FILTER = import.meta.env.VITE_ANNOT_USER_FILTER;
            const apiKey = import.meta.env.VITE_ANNOT_API_KEY;
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                try {
                    const response = await fetch(`${API_ENDPOINT}?user=${USER_FILTER}&offset=${offset}`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    this.annotations = this.annotations.concat(data.rows);

                    // Check if there are more results to fetch
                    hasMore = data.rows.length > 0;
                    offset += data.rows.length;

                    // Add delay to respect rate limits
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (error) {
                    console.error("Error fetching annotations:", error);
                    break;
                }
            }

            return this.annotations;
        },
    },
});
