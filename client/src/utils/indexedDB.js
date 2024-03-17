 export const useIndexedDB = () => {
  const dbname = 'penitin-dev';
  const storeName = 'userdata';

  // This should match the version you've worked with previously
  // Increment it if you're making changes to the database structure
  const version = 1; 

  const getDBConnection = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbname, version);

      request.onerror = (event) => {
        console.error("Database error: ", event.target.error);
        reject(new Error('Could not open IndexedDB'));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        let db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'npub' });
        }
      };
    });
  };

  const set = async (npub, data) => {
    const db = await getDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put({ npub, ...data });

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error("Could not insert data into store: ", event.target.error);
        reject(new Error('Data insertion failed'));
      };  
    });
  };

  const get = async (npub) => {
    const db = await getDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(npub);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error("Could not fetch data from store: ", event.target.error);
        reject(new Error('Data fetch failed'));
      };   
    });
  };

  return { set, get };
}
