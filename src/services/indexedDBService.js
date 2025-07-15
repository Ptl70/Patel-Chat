// IndexedDB service for enhanced local persistence

const DB_NAME = 'PatelChatDB';
const DB_VERSION = 1;
const STORES = {
  CHAT_SESSIONS: 'chatSessions',
  QUICK_PROMPTS: 'quickPrompts',
  USER_STATS: 'userStats',
  THEMES: 'themes',
  EMBEDDINGS: 'embeddings'
};

let db = null;

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Chat Sessions store
      if (!database.objectStoreNames.contains(STORES.CHAT_SESSIONS)) {
        const chatStore = database.createObjectStore(STORES.CHAT_SESSIONS, { keyPath: 'id' });
        chatStore.createIndex('lastUpdatedAt', 'lastUpdatedAt', { unique: false });
        chatStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Quick Prompts store
      if (!database.objectStoreNames.contains(STORES.QUICK_PROMPTS)) {
        database.createObjectStore(STORES.QUICK_PROMPTS, { keyPath: 'id' });
      }

      // User Stats store
      if (!database.objectStoreNames.contains(STORES.USER_STATS)) {
        database.createObjectStore(STORES.USER_STATS, { keyPath: 'id' });
      }

      // Themes store
      if (!database.objectStoreNames.contains(STORES.THEMES)) {
        database.createObjectStore(STORES.THEMES, { keyPath: 'id' });
      }

      // Embeddings store for semantic search
      if (!database.objectStoreNames.contains(STORES.EMBEDDINGS)) {
        const embeddingStore = database.createObjectStore(STORES.EMBEDDINGS, { keyPath: 'id' });
        embeddingStore.createIndex('chatId', 'chatId', { unique: false });
        embeddingStore.createIndex('messageId', 'messageId', { unique: true });
      }
    };
  });
};

/**
 * Generic function to get all items from a store
 * @param {string} storeName 
 * @returns {Promise<Array>}
 */
export const getAllFromStore = async (storeName) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Generic function to add or update an item in a store
 * @param {string} storeName 
 * @param {Object} item 
 * @returns {Promise<void>}
 */
export const putInStore = async (storeName, item) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Generic function to delete an item from a store
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<void>}
 */
export const deleteFromStore = async (storeName, id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get a specific item from a store
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export const getFromStore = async (storeName, id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// Chat Sessions specific functions
export const getChatSessions = () => getAllFromStore(STORES.CHAT_SESSIONS);
export const saveChatSession = (session) => putInStore(STORES.CHAT_SESSIONS, session);
export const deleteChatSession = (id) => deleteFromStore(STORES.CHAT_SESSIONS, id);

// Quick Prompts specific functions
export const getQuickPrompts = () => getAllFromStore(STORES.QUICK_PROMPTS);
export const saveQuickPrompt = (prompt) => putInStore(STORES.QUICK_PROMPTS, prompt);
export const deleteQuickPrompt = (id) => deleteFromStore(STORES.QUICK_PROMPTS, id);

// User Stats specific functions
export const getUserStats = () => getFromStore(STORES.USER_STATS, 'main');
export const saveUserStats = (stats) => putInStore(STORES.USER_STATS, { id: 'main', ...stats });

// Themes specific functions
export const getThemes = () => getAllFromStore(STORES.THEMES);
export const saveTheme = (theme) => putInStore(STORES.THEMES, theme);
export const deleteTheme = (id) => deleteFromStore(STORES.THEMES, id);

// Embeddings specific functions
export const saveEmbedding = (embedding) => putInStore(STORES.EMBEDDINGS, embedding);
export const getEmbeddingsByChat = async (chatId) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.EMBEDDINGS], 'readonly');
    const store = transaction.objectStore(STORES.EMBEDDINGS);
    const index = store.index('chatId');
    const request = index.getAll(chatId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Fallback to localStorage if IndexedDB fails
 */
export const fallbackToLocalStorage = {
  getChatSessions: () => {
    try {
      const sessions = localStorage.getItem('patelChatSessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveChatSessions: (sessions) => {
    try {
      localStorage.setItem('patelChatSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  getQuickPrompts: () => {
    try {
      const prompts = localStorage.getItem('patelChatQuickPrompts');
      return prompts ? JSON.parse(prompts) : [];
    } catch (error) {
      console.error('Error reading quick prompts from localStorage:', error);
      return [];
    }
  },

  saveQuickPrompts: (prompts) => {
    try {
      localStorage.setItem('patelChatQuickPrompts', JSON.stringify(prompts));
    } catch (error) {
      console.error('Error saving quick prompts to localStorage:', error);
    }
  }
};

