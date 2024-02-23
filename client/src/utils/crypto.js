// const secret = window.crypto.getRandomValues(new Uint8Array(32));
// const salt = window.crypto.getRandomValues(new Uint8Array(16));
// const iv = window.crypto.getRandomValues(new Uint8Array(12));
// const secretBase64 = toBase64(secret);
// const saltBase64 = toBase64(salt);
// const ivBase64 = toBase64(iv);

export const deriveAESKey = async (secretBase64, saltBase64) => {
    const secret = fromBase64(secretBase64);
    const salt = fromBase64(saltBase64);
    // Import the shared secret as raw bits
    const importedSecret = await window.crypto.subtle.importKey('raw', secret, {name: 'HKDF'}, false, ['deriveKey']);

    // Define HKDF parameters.
    const deriveParams = {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: salt,
        // since using AES-GCM, the info parameter isn't truly applicable and will just be an empty ArrayBuffer
        info: new ArrayBuffer(0),
    };

    // Derive the AES key
    const aesKey = await window.crypto.subtle.deriveKey(
        deriveParams, 
        importedSecret, 
        { name: 'AES-GCM', length: 256 }, 
        true, 
        ['encrypt', 'decrypt']
    );

    return aesKey;
}

export const encrypt = async (aesKey, ivBase64, content) => {
    const encoded = new TextEncoder().encode(content);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: fromBase64(ivBase64) }, 
        aesKey, 
        encoded
    );

    return {
        content: toBase64( new Uint8Array(encrypted) ),
        ivBase64: ivBase64 
    };
};

export const decrypt = async (aesKey, ivBase64, content) => {
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(ivBase64) }, aesKey, fromBase64(content)
    );
    const decoded = new TextDecoder().decode(decrypted);

    return decoded;
};

// HELPERS
export const toBase64 = arrayBuffer => {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

const fromBase64 = base64String => {
  return Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
}
