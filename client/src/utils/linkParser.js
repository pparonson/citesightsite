// Function to parse and replace `[[...]]` links in the provided content
export function parseLinks(content, checkIfEventExists) {
    const internalLinkPattern = /\[\[([^[\]]+?)(?:,\s*([a-zA-Z0-9_-]+))?\]\]/g;

    // Replace detected links with anchor tags
    let html = content.replace(internalLinkPattern, (match, p1, p2) => {
        const eventTitle = p1.trim();
        const eventId = p2 ? p2.trim() : '';
        const existingEvent = checkIfEventExists(eventId);
        const eventType = (existingEvent?.id && existingEvent?.group) ? 
            'annotation' : 
            (existingEvent?.id && existingEvent?.kind === 30024) ? 
            'noteEvent' : 
            (existingEvent?.id && existingEvent?.kind === 30023) ? 
            'followsEvent' : 
            '';
        const linkClass = (existingEvent?.id && existingEvent?.group) ? 
            'annotation-event-link' : 
            (existingEvent?.id && existingEvent?.kind === 30024) ? 
            'note-event-link' : 
            (existingEvent?.id && existingEvent?.kind === 30023) ?
            'follows-event-link' :
            'broken-event-link';
        return `<a class="${linkClass} internal-link" href="#" data-event-id="${eventId}" data-event-type="${eventType}" data-event-title="${eventTitle}">
            ${eventTitle}</a>`;
    });

    return html;
}

