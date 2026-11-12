/**
 * IndexedDB storage helper for HilalPOS
 * Provides unlimited quota persistent storage for products and high-res photos
 */

import { Product } from '../types';

const DB_NAME = 'HilalPosDB';
const DB_VERSION = 1;
const STORE_NAME = 'products_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save all products to IndexedDB permanently
 */
export async function idbSaveProducts(products: Product[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing records and re-insert
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        let count = 0;
        if (products.length === 0) {
          resolve(true);
          return;
        }

        products.forEach((p) => {
          store.put(p);
        });

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => {
          console.warn('IDB transaction error', transaction.error);
          resolve(false);
        };
      };

      clearRequest.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Could not save to IndexedDB', e);
    return false;
  }
}

/**
 * Get all products from IndexedDB
 */
export async function idbGetProducts(): Promise<Product[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results: Product[] = request.result || [];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Could not read from IndexedDB', e);
    return null;
  }
}
