import DOMPurify from 'dompurify';

// Function to parse and replace `[[...]]` links in the provided content
export function parseLinks(content, checkIfNoteExists) {
    const linkPattern = /\[\[([^[\]]+)\]\]/g;

    // Replace detected links with anchor tags
    let html = content.replace(linkPattern, (match, p1) => {
        const noteTitle = p1.trim();
        const existingNote = checkIfNoteExists(noteTitle);
        let linkClass = existingNote ? "existing-note-link" : "new-note-link";
        return `<a class="${linkClass}" href="#" data-note-title="${noteTitle}">${noteTitle}</a>`;
    });

    return DOMPurify.sanitize(html);
}

export function checkIfNoteExists(noteTitle) {
    // TODO: Your logic to check if the note exists.
    // Implement this using logic to fetch or check from your application's state or data.
    return false; 
}
