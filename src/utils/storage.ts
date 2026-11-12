import { Category, Product, StockMovement, StoreSettings, Supplier, Transaction } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_SUPPLIERS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { idbSaveProducts, idbGetProducts } from './indexedDbStorage';

const STORAGE_KEYS = {
  PRODUCTS: 'hilalpos_products',
  CATEGORIES: 'hilalpos_categories',
  TRANSACTIONS: 'hilalpos_transactions',
  SETTINGS: 'hilalpos_settings',
  STOCK_MOVEMENTS: 'hilalpos_stock_movements',
  SUPPLIERS: 'hilalpos_suppliers',
  OFFLINE_QUEUE: 'hilalpos_offline_queue',
  DELETED_PRODUCT_IDS: 'hilalpos_deleted_product_ids',
  SHOPEE_CATALOG_SYNCED: 'hilalpos_catalog_v15_all_local_photos',
};

// Permanently deleted product IDs tracking
export const getDeletedProductIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_PRODUCT_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading deleted product IDs', e);
    return [];
  }
};

export const markProductPermanentlyDeleted = (id: string): void => {
  try {
    const deleted = getDeletedProductIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, JSON.stringify(deleted));
    }

    // Immediately remove from stored products in localStorage
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      const filtered = parsed.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
      idbSaveProducts(filtered);
    }
  } catch (e) {
    console.error('Error marking product permanently deleted', e);
  }
};

export const getStoredProducts = (): Product[] => {
  try {
    const deletedIds = new Set(getDeletedProductIds());
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

    if (!raw) {
      // First time initialization
      const initialValid = INITIAL_PRODUCTS.filter((p) => !deletedIds.has(p.id));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialValid));
      localStorage.setItem(STORAGE_KEYS.SHOPEE_CATALOG_SYNCED, 'true');
      idbSaveProducts(initialValid);
      return initialValid;
    }

    let parsed: Product[] = JSON.parse(raw);
    // Ensure no deleted product ever slips through
    parsed = parsed.filter((p) => !deletedIds.has(p.id));

    // One-time sync: upgrade all products to use 100% local, offline, reliable photos
    const isLocalSynced = localStorage.getItem(STORAGE_KEYS.SHOPEE_CATALOG_SYNCED);
    if (!isLocalSynced) {
      const existingIds = new Set(parsed.map((p) => p.id));
      // Update any existing products with the local offline images from INITIAL_PRODUCTS
      parsed = parsed.map((p) => {
        // If it's a default product from initial data, update its image to the verified local image
        const fresh = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
        if (fresh) {
          return {
            ...p,
            name: fresh.name,
            sellPrice: fresh.sellPrice || p.sellPrice,
            image: fresh.image, // verified 100% local offline image
            variants: fresh.variants || p.variants,
          };
        }
        // If it's a product whose image still points to external unsplash that failed
        if (p.image && (p.image.includes('unsplash.com') || p.image.startsWith('http://') || p.image.startsWith('https://'))) {
          return {
            ...p,
            image: '/assets/products/shopee/fc_dust_free.jpg',
          };
        }
        return p;
      });

      // Also append any missing initial products (only if not permanently deleted)
      const missingInitial = INITIAL_PRODUCTS.filter(
        (p) => !existingIds.has(p.id) && !deletedIds.has(p.id)
      );
      if (missingInitial.length > 0) {
        parsed = [...parsed, ...missingInitial];
      }

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed));
      localStorage.setItem(STORAGE_KEYS.SHOPEE_CATALOG_SYNCED, 'true');
      idbSaveProducts(parsed);
    }

    // Top 5 from the user's latest screenshots
    const featuredTopIds = [
      'prod-tombow-monozero',
      'prod-vtec-palet-oval',
      'prod-bantex-sketchbook',
      'prod-pentel-gg1000',
      'prod-touchmark-markers',
    ];

    const userAddedItems: Product[] = [];
    const featuredItems: Product[] = [];
    const otherShopeeItems: Product[] = [];
    const otherItems: Product[] = [];

    parsed.forEach((p) => {
      // Accurately detect if this product is user-created (not from default INITIAL_PRODUCTS)
      const isUserItem = 
        Boolean((p as any).isCustom) || 
        p.id.startsWith('prod-user-') || 
        p.id.startsWith('prod-1') ||
        p.id.startsWith('prod-2') ||
        p.image?.startsWith('data:image/') ||
        !INITIAL_PRODUCTS.some((ip) => ip.id === p.id);

      if (isUserItem) {
        userAddedItems.push(p);
      } else if (featuredTopIds.includes(p.id)) {
        featuredItems.push(p);
      } else if (p.image?.startsWith('/assets/products/shopee/')) {
        otherShopeeItems.push(p);
      } else {
        otherItems.push(p);
      }
    });

    // Sort user added items newest first
    userAddedItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    // Preserve order of featured items
    featuredItems.sort((a, b) => featuredTopIds.indexOf(a.id) - featuredTopIds.indexOf(b.id));

    return [...userAddedItems, ...featuredItems, ...otherShopeeItems, ...otherItems];
  } catch (e) {
    console.error('Error reading products from storage', e);
    return INITIAL_PRODUCTS;
  }
};

export const saveStoredProducts = (products: Product[]) => {
  try {
    const deletedIds = new Set(getDeletedProductIds());
    // Filter out any permanently deleted products before saving
    const cleanProducts = products.filter((p) => !deletedIds.has(p.id));

    // 1. Permanently save to IndexedDB (asynchronous, practically unlimited quota)
    idbSaveProducts(cleanProducts).catch((err) => {
      console.warn('idbSaveProducts background error:', err);
    });

    // 2. Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cleanProducts));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached, relying on IndexedDB persistence', quotaErr);
    }
  } catch (e) {
    console.error('Error saving products', e);
  }
};

export const getStoredCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed: Category[] = JSON.parse(raw);
    if (parsed.length < INITIAL_CATEGORIES.length) {
      const existingIds = new Set(parsed.map(c => c.id));
      const missing = INITIAL_CATEGORIES.filter(c => !existingIds.has(c.id));
      const full = [...parsed, ...missing];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(full));
      return full;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading categories from storage', e);
    return INITIAL_CATEGORIES;
  }
};

export const saveStoredCategories = (categories: Category[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories', e);
  }
};

export const getStoredTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading transactions from storage', e);
    return INITIAL_TRANSACTIONS;
  }
};

export const saveStoredTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions', e);
  }
};

export const getStoredSettings = (): StoreSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading settings from storage', e);
    return INITIAL_SETTINGS;
  }
};

export const saveStoredSettings = (settings: StoreSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

export const getStoredStockMovements = (): StockMovement[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    if (!raw) {
      const initialMovements: StockMovement[] = [
        {
          id: 'mov-1',
          date: '2026-11-01T10:00:00Z',
          productId: 'prod-001',
          productName: 'Pensil Graphite 2B',
          type: 'in',
          quantity: 150,
          previousStock: 0,
          newStock: 150,
          referenceNumber: 'PO-202611-01',
          reason: 'Penerimaan barang masuk dari PT Faber-Castell',
          recordedBy: 'Hilal'
        },
        {
          id: 'mov-2',
          date: '2026-11-02T14:30:00Z',
          productId: 'prod-002',
          productName: 'Cat Akrilik 75ml',
          type: 'in',
          quantity: 100,
          previousStock: 0,
          newStock: 100,
          referenceNumber: 'PO-202611-02',
          reason: 'Stok awal distributor Mont Marte',
          recordedBy: 'Hilal'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(initialMovements));
      return initialMovements;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading stock movements', e);
    return [];
  }
};

export const saveStoredStockMovements = (movements: StockMovement[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
  } catch (e) {
    console.error('Error saving stock movements', e);
  }
};

export const getStoredSuppliers = (): Supplier[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading suppliers', e);
    return INITIAL_SUPPLIERS;
  }
};

export const saveStoredSuppliers = (suppliers: Supplier[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  } catch (e) {
    console.error('Error saving suppliers', e);
  }
};

export const exportDatabaseJSON = (): string => {
  const backup = {
    appName: 'HILALPOS',
    store: 'Hilal.art',
    timestamp: new Date().toISOString(),
    products: getStoredProducts(),
    categories: getStoredCategories(),
    transactions: getStoredTransactions(),
    settings: getStoredSettings(),
    stockMovements: getStoredStockMovements(),
    suppliers: getStoredSuppliers(),
  };
  return JSON.stringify(backup, null, 2);
};

export const importDatabaseJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.products) saveStoredProducts(data.products);
    if (data.categories) saveStoredCategories(data.categories);
    if (data.transactions) saveStoredTransactions(data.transactions);
    if (data.settings) saveStoredSettings(data.settings);
    if (data.stockMovements) saveStoredStockMovements(data.stockMovements);
    if (data.suppliers) saveStoredSuppliers(data.suppliers);
    return true;
  } catch (e) {
    console.error('Failed to import database JSON', e);
    return false;
  }
};

export const resetDatabaseToDefault = () => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
  localStorage.removeItem(STORAGE_KEYS.DELETED_PRODUCT_IDS);
  localStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS);
};
