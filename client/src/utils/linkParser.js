// Function to parse and replace `[[...]]` links in the provided content
export function parseLinks(content, checkIfEventExists) {
    // const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;
    const internalLinkPattern = /\[\[([^[\]]+?)(?:,\s*([a-f0-9]+))?\]\]/g;

    // Replace detected links with anchor tags
    let html = content.replace(internalLinkPattern, (match, p1, p2) => {
        const eventTitle = p1.trim();
        const eventId = p2 ? p2.trim() : "";
        const existingEvent = checkIfEventExists(eventId);
        const eventType = existingEvent?.type ? existingEvent.type : "";
        let linkClass = existingEvent?.type === "noteEvent" ? 
            "note-event-link" : 
            existingEvent?.type === "annotation" ? 
            "annotation-event-link" : 
            "broken-event-link";
        return `<a class="${linkClass} internal-link" href="#" data-event-id="${eventId}" data-event-type="${eventType}" data-event-title="${eventTitle}">
            ${eventTitle}</a>`;
    });

    return html;
}

