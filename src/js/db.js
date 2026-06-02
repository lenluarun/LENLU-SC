import { S } from './state.js';

const DB_NAME = 'lenluForgeDB';
const DB_VERSION = 1;
let db = null;

export function initDatabase() {
  return new Promise((resolve) => {
    // Check if indexedDB is supported
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      loadFallback();
      resolve();
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('store')) {
        database.createObjectStore('store');
      }
    };
    
    req.onsuccess = (e) => {
      db = e.target.result;
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      
      const getVault = store.get('vault');
      const getHist = store.get('history');
      
      let loaded = 0;
      const checkDone = () => {
        loaded++;
        if (loaded === 2) {
          resolve();
        }
      };
      
      getVault.onsuccess = () => {
        S.vault = getVault.result || [];
        // Migration from localStorage if IndexedDB was empty but localStorage had data
        if (S.vault.length === 0) {
          try {
            const local = JSON.parse(localStorage.getItem('lenlu_vault4'));
            if (Array.isArray(local) && local.length > 0) {
              S.vault = local;
              saveVaultToDB();
            }
          } catch (err) {}
        }
        checkDone();
      };
      getVault.onerror = () => {
        S.vault = [];
        checkDone();
      };
      
      getHist.onsuccess = () => {
        S.history = getHist.result || [];
        // Migration from localStorage
        if (S.history.length === 0) {
          try {
            const local = JSON.parse(localStorage.getItem('lenlu_hist4'));
            if (Array.isArray(local) && local.length > 0) {
              S.history = local;
              saveHistoryToDB();
            }
          } catch (err) {}
        }
        checkDone();
      };
      getHist.onerror = () => {
        S.history = [];
        checkDone();
      };
    };
    
    req.onerror = () => {
      console.error('IndexedDB open error, falling back to localStorage');
      loadFallback();
      resolve();
    };
  });
}

function loadFallback() {
  try { S.vault = JSON.parse(localStorage.getItem('lenlu_vault4') || '[]'); } catch { S.vault = []; }
  try { S.history = JSON.parse(localStorage.getItem('lenlu_hist4') || '[]'); } catch { S.history = []; }
}

export function saveVaultToDB() {
  if (!db) {
    localStorage.setItem('lenlu_vault4', JSON.stringify(S.vault));
    return;
  }
  try {
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(S.vault, 'vault');
  } catch (e) {
    console.error('Failed to write vault to IndexedDB', e);
  }
}

export function saveHistoryToDB() {
  if (!db) {
    localStorage.setItem('lenlu_hist4', JSON.stringify(S.history));
    return;
  }
  try {
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(S.history, 'history');
  } catch (e) {
    console.error('Failed to write history to IndexedDB', e);
  }
}

export function clearDatabase() {
  if (!db) {
    localStorage.removeItem('lenlu_vault4');
    localStorage.removeItem('lenlu_hist4');
    return;
  }
  try {
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').delete('vault');
    tx.objectStore('store').delete('history');
  } catch (e) {
    console.error('Failed to clear database', e);
  }
}
