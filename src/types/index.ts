export type Role = 'Admin' | 'Kasir';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "2B", "4B", "75 ml", "Set 12", "A5", "40x60 cm"
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string; // e.g. "pcs", "tube", "set", "lbr", "roll"
}

export interface UnitConversion {
  unit: string; // e.g. "Pak (12 pcs)", "Box (24 pcs)"
  conversionFactor: number; // e.g. 12
  price: number; // e.g. discount pack price
}

export interface Product {
  id: string;
  code: string; // e.g. "SK-001" or "BB-001"
  name: string;
  brand: string;
  categoryId: string;
  categoryName?: string;
  series?: string;
  type: string; // e.g. "Pensil Gambar", "Cat Akrilik", "Kuas Lukis"
  description: string;
  image: string;
  additionalImages?: string[];
  unit: string; // Satuan dasar e.g. "pcs"
  altUnits?: UnitConversion[];
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  sku: string;
  barcode: string;
  variants?: ProductVariant[];
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique cart item id (productId + variantId)
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  brand: string;
  sku: string;
  barcode: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
  image: string;
  availableStock: number;
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'debit' | 'credit' | 'ewallet';

export interface Transaction {
  id: string;
  invoiceNumber: string; // e.g. "TR-20261105-0001"
  date: string; // ISO date string
  cashierName: string;
  adminName: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number; // 0.11 for 11%
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  isSynced: boolean;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber?: string;
  reason: string;
  recordedBy: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  category: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  adminName: string;
  activeCashier: string;
  footerReceiptMsg: string;
  taxEnabled: boolean;
  taxPercentage: number;
  receiptPaperWidth: '58mm' | '80mm';
  showReceiptLogo: boolean;
  isOnline: boolean;
  lastSyncedAt: string;
}
