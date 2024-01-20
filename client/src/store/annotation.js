import { defineStore } from "pinia";
import config from "./../../config/config";

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
            const { annotApiEndpoint, rateLimitMs, userFilter, apiKey } = config.connections.annotation;
            // const userFilter = import.meta.env.VITE_ANNOT_USER_FILTER || "";
            // const apiKey = import.meta.env.VITE_ANNOT_API_KEY || "";

            let searchAfter = null;

            const headers = {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/vnd.hypothesis.v1+json",
            };

            if (!userFilter || !apiKey) {
                console.log("Annotations is not configured..");
            } else {
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
                        searchAfter = data.rows[data.rows.length - 1].updated;
                    } else {
                        break;
                    }

                    // Rate limit
                    await sleep(rateLimitMs);
                }

                return this.annotations;
            }
        },
    },
});
