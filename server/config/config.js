export default {
    defaultTimeout: 35000,
    connections: {
        dockerUserDefinedNetwork: {
            server: { url: "http://server", port: 4000 },
            worker: { url: "http://worker", port: 5000 },
        },
    },
};
