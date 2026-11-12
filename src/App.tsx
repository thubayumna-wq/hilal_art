/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CartItem, 
  Category, 
  Product, 
  ProductVariant, 
  StockMovement, 
  StoreSettings, 
  Transaction 
} from './types';
import { 
  getStoredCategories, 
  getStoredProducts, 
  getStoredSettings, 
  getStoredStockMovements, 
  getStoredTransactions, 
  saveStoredCategories, 
  saveStoredProducts, 
  saveStoredSettings, 
  saveStoredStockMovements, 
  saveStoredTransactions,
  markProductPermanentlyDeleted,
  getDeletedProductIds
} from './utils/storage';
import { idbGetProducts } from './utils/indexedDbStorage';
import { INITIAL_CART } from './data/initialData';

import { ActiveTab, Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FooterBar } from './components/layout/FooterBar';
import { PosView } from './components/pos/PosView';
import { CartPanel } from './components/pos/CartPanel';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { ProductManagement } from './components/products/ProductManagement';
import { StockManagement } from './components/stock/StockManagement';
import { TransactionHistory } from './components/transactions/TransactionHistory';
import { ReportsView } from './components/reports/ReportsView';
import { StoreDashboardView } from './components/dashboard/StoreDashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { downloadReceiptPDF } from './utils/receiptGenerator';
import { ShoppingCart, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Cart State (Starts empty so user chooses items first)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [completedReceiptTrx, setCompletedReceiptTrx] = useState<Transaction | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Load Initial Data with dual localStorage and IndexedDB fallback
  useEffect(() => {
    const localProducts = getStoredProducts();
    setProducts(localProducts);
    setCategories(getStoredCategories());
    setTransactions(getStoredTransactions());
    const savedSettings = getStoredSettings();
    setSettings(savedSettings);
    setTaxEnabled(savedSettings.taxEnabled);
    setStockMovements(getStoredStockMovements());

    // Also check IndexedDB backup to ensure custom products with high-res photos are always restored
    idbGetProducts().then((idbProducts) => {
      if (idbProducts && idbProducts.length > 0) {
        const deletedIds = new Set(getDeletedProductIds());
        const validIdb = idbProducts.filter((p) => !deletedIds.has(p.id));
        const localIds = new Set(localProducts.map((p) => p.id));
        const missingFromLocal = validIdb.filter((p) => !localIds.has(p.id));
        if (missingFromLocal.length > 0) {
          const merged = [...missingFromLocal, ...localProducts];
          setProducts(merged);
          saveStoredProducts(merged);
        }
      }
    });
  }, []);

  // Sync helpers
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
  };

  const handleUpdateTransactions = (updatedTrx: Transaction[]) => {
    setTransactions(updatedTrx);
    saveStoredTransactions(updatedTrx);
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    setTaxEnabled(newSettings.taxEnabled);
    saveStoredSettings(newSettings);
  };

  const handleUpdateStockMovements = (updatedMovements: StockMovement[]) => {
    setStockMovements(updatedMovements);
    saveStoredStockMovements(updatedMovements);
  };

  // Add to Cart
  const handleAddToCart = (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1,
    selectedUnit?: string
  ) => {
    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
    const unitPrice = variant ? variant.price : product.sellPrice;
    const costPrice = variant ? variant.costPrice : product.costPrice;
    const availableStock = variant ? variant.stock : product.stock;
    const sku = variant ? variant.sku : product.sku;
    const barcode = variant ? variant.barcode : product.barcode;
    const unit = selectedUnit || (variant ? variant.unit : product.unit);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const newQty = Math.min(availableStock, existing.quantity + quantity);
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unitPrice,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          variantId: variant?.id,
          name: product.name,
          variantName: variant?.name,
          brand: product.brand,
          sku,
          barcode,
          unit,
          unitPrice,
          costPrice,
          quantity: Math.min(availableStock, quantity),
          discount: 0,
          subtotal: Math.min(availableStock, quantity) * unitPrice,
          image: product.image,
          availableStock,
        };
        return [...prevCart, newItem];
      }
    });
  };

  // Instant Buy (Add + directly open checkout)
  const handleInstantBuy = (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1,
    selectedUnit?: string
  ) => {
    handleAddToCart(product, variant, quantity, selectedUnit);
    setTimeout(() => {
      setIsPaymentOpen(true);
    }, 50);
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const validQty = Math.min(item.availableStock, newQty);
          return {
            ...item,
            quantity: validQty,
            subtotal: validQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // Remove single item from cart
  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Process Completed Payment
  const handlePaymentSuccess = (newTrx: Transaction) => {
    setIsPaymentOpen(false);

    // 1. Save Transaction
    const updatedTransactions = [newTrx, ...transactions];
    handleUpdateTransactions(updatedTransactions);

    // 2. Reduce Stock of purchased products/variants and log movements
    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      let currentProd = { ...prod };
      const purchasedForProd = newTrx.items.filter((it) => it.productId === prod.id);

      if (purchasedForProd.length > 0) {
        purchasedForProd.forEach((pItem) => {
          if (pItem.variantId && currentProd.variants) {
            // Update specific variant stock
            const updatedVariants = currentProd.variants.map((v) => {
              if (v.id === pItem.variantId) {
                const prev = v.stock;
                const nextStock = Math.max(0, v.stock - pItem.quantity);
                newMovements.push({
                  id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  date: newTrx.date,
                  productId: prod.id,
                  productName: `${prod.name} (${v.name})`,
                  variantId: v.id,
                  variantName: v.name,
                  type: 'sale',
                  quantity: pItem.quantity,
                  previousStock: prev,
                  newStock: nextStock,
                  referenceNumber: newTrx.invoiceNumber,
                  reason: `Penjualan Kasir #${newTrx.invoiceNumber}`,
                  recordedBy: newTrx.cashierName,
                });
                return { ...v, stock: nextStock };
              }
              return v;
            });
            currentProd.variants = updatedVariants;
          }

          // Also reduce total product base stock
          const prevBase = currentProd.stock;
          const nextBaseStock = Math.max(0, currentProd.stock - pItem.quantity);
          currentProd.stock = nextBaseStock;

          if (!pItem.variantId) {
            newMovements.push({
              id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              date: newTrx.date,
              productId: prod.id,
              productName: prod.name,
              type: 'sale',
              quantity: pItem.quantity,
              previousStock: prevBase,
              newStock: nextBaseStock,
              referenceNumber: newTrx.invoiceNumber,
              reason: `Penjualan Kasir #${newTrx.invoiceNumber}`,
              recordedBy: newTrx.cashierName,
            });
          }
        });
      }
      return currentProd;
    });

    handleUpdateProducts(updatedProducts);
    handleUpdateStockMovements([...newMovements, ...stockMovements]);

    // 3. Clear cart
    setCart([]);
    setDiscount(0);

    // 4. Open Receipt Modal
    setCompletedReceiptTrx(newTrx);
  };

  // Refund / Cancel Transaction
  const handleCancelTransaction = (trxId: string, reason: string) => {
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (!targetTrx || targetTrx.status === 'cancelled' || targetTrx.status === 'refunded') return;

    // 1. Update status
    const updatedTransactions = transactions.map((t) => {
      if (t.id === trxId) {
        return {
          ...t,
          status: 'refunded' as const,
          notes: (t.notes ? t.notes + ' | ' : '') + `Retur: ${reason}`,
        };
      }
      return t;
    });
    handleUpdateTransactions(updatedTransactions);

    // 2. Restore stocks and log
    const returnMovements: StockMovement[] = [];
    const restoredProducts = products.map((prod) => {
      let currentProd = { ...prod };
      const returnedItems = targetTrx.items.filter((it) => it.productId === prod.id);

      returnedItems.forEach((rItem) => {
        if (rItem.variantId && currentProd.variants) {
          const restoredVariants = currentProd.variants.map((v) => {
            if (v.id === rItem.variantId) {
              const prev = v.stock;
              const nextStock = v.stock + rItem.quantity;
              returnMovements.push({
                id: 'mov-ret-' + Date.now(),
                date: new Date().toISOString(),
                productId: prod.id,
                productName: `${prod.name} (${v.name})`,
                variantId: v.id,
                variantName: v.name,
                type: 'return',
                quantity: rItem.quantity,
                previousStock: prev,
                newStock: nextStock,
                referenceNumber: targetTrx.invoiceNumber,
                reason: `Retur: ${reason}`,
                recordedBy: settings.adminName,
              });
              return { ...v, stock: nextStock };
            }
            return v;
          });
          currentProd.variants = restoredVariants;
        }

        const prevBase = currentProd.stock;
        const nextBaseStock = currentProd.stock + rItem.quantity;
        currentProd.stock = nextBaseStock;

        if (!rItem.variantId) {
          returnMovements.push({
            id: 'mov-ret-' + Date.now(),
            date: new Date().toISOString(),
            productId: prod.id,
            productName: prod.name,
            type: 'return',
            quantity: rItem.quantity,
            previousStock: prevBase,
            newStock: nextBaseStock,
            referenceNumber: targetTrx.invoiceNumber,
            reason: `Retur: ${reason}`,
            recordedBy: settings.adminName,
          });
        }
      });
      return currentProd;
    });

    handleUpdateProducts(restoredProducts);
    handleUpdateStockMovements([...returnMovements, ...stockMovements]);
  };

  // Stock Adjustments (In, Out, Opname)
  const handleUpdateProductStock = (
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string
  ) => {
    let movement: StockMovement | null = null;

    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        const prevStock = p.stock;
        let newStock = p.stock;

        if (type === 'in') newStock = prevStock + quantity;
        else if (type === 'out') newStock = Math.max(0, prevStock - quantity);
        else if (type === 'adjustment') newStock = quantity;

        movement = {
          id: 'mov-' + Date.now(),
          date: new Date().toISOString(),
          productId: p.id,
          productName: p.name,
          type,
          quantity,
          previousStock: prevStock,
          newStock,
          reason,
          recordedBy: settings.adminName,
        };

        return { ...p, stock: newStock };
      }
      return p;
    });

    handleUpdateProducts(updatedProducts);
    if (movement) {
      handleUpdateStockMovements([movement, ...stockMovements]);
    }
  };

  // Product CRUD
  const handleAddProduct = (newProduct: Product) => {
    const cleanProduct: Product = { ...newProduct, ...( { isCustom: true } as any ) };
    const updated = [cleanProduct, ...products.filter((p) => p.id !== newProduct.id)];
    handleUpdateProducts(updated);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const cleanProduct: Product = { ...updatedProduct, ...( { isCustom: true } as any ) };
    const updated = products.map((p) => (p.id === updatedProduct.id ? cleanProduct : p));
    handleUpdateProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    markProductPermanentlyDeleted(productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Low stock warning count
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxableSubtotal = Math.max(0, cartSubtotal - discount);
  const taxRate = (settings.taxPercentage || 11) / 100;
  const taxAmount = taxEnabled ? Math.round(taxableSubtotal * taxRate) : 0;
  const cartTotal = taxableSubtotal + taxAmount;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick Print draft/estimate from cart
  const handleQuickPrintCart = () => {
    const draftTrx: Transaction = {
      id: 'draft-' + Date.now(),
      invoiceNumber: 'DRAFT-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      cashierName: settings.activeCashier,
      adminName: settings.adminName,
      customerName: 'Pelanggan Toko',
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount: discount,
      taxRate,
      taxAmount,
      totalAmount: cartTotal,
      paymentMethod: 'tunai',
      amountPaid: cartTotal,
      changeAmount: 0,
      status: 'completed',
      isSynced: true,
    };
    setCompletedReceiptTrx(draftTrx);
  };

  const handleQuickDownloadPDFCart = () => {
    const draftTrx: Transaction = {
      id: 'draft-' + Date.now(),
      invoiceNumber: 'DRAFT-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      cashierName: settings.activeCashier,
      adminName: settings.adminName,
      customerName: 'Pelanggan Toko',
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount: discount,
      taxRate,
      taxAmount,
      totalAmount: cartTotal,
      paymentMethod: 'tunai',
      amountPaid: cartTotal,
      changeAmount: 0,
      status: 'completed',
      isSynced: true,
    };
    downloadReceiptPDF(draftTrx, settings, settings.receiptPaperWidth || '80mm');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F3] font-sans text-slate-800">
      {/* Desktop & Mobile Sidebar */}
      <div className={`hidden md:block shrink-0 ${mobileMenuOpen ? '!block fixed inset-y-0 left-0 z-50' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          lowStockCount={lowStockCount}
        />
      </div>

      {/* Main Workspace Frame (Unified scroll container so header & top bar scroll along) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Global Header */}
        <Header
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          lowStockCount={lowStockCount}
          cartCount={cartItemsCount}
          cartTotal={cartTotal}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSelectTab={setActiveTab}
          onToggleCart={() => setIsCartDrawerOpen(!isCartDrawerOpen)}
        />

        {/* Central Active View */}
        <div className="flex-1 flex min-h-0 relative">
          {(activeTab === 'dashboard' || activeTab === 'pos') && (
            <StoreDashboardView
              products={products}
              categories={categories}
              cart={cart}
              discount={discount}
              taxEnabled={taxEnabled}
              taxRate={taxRate}
              settings={settings}
              transactions={transactions}
              onAddToCart={handleAddToCart}
              onInstantBuy={handleInstantBuy}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onUpdateDiscount={setDiscount}
              onToggleTax={() => setTaxEnabled(!taxEnabled)}
              onOpenCheckout={() => setIsPaymentOpen(true)}
              onQuickPrint={handleQuickPrintCart}
              onQuickDownloadPDF={handleQuickDownloadPDFCart}
              onLoadSampleCart={() => setCart(INITIAL_CART)}
              onNavigateTab={setActiveTab}
              onOpenCart={() => setIsCartDrawerOpen(true)}
              initialMode="pos"
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagement
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'stock' && (
            <StockManagement
              products={products}
              settings={settings}
              stockMovements={stockMovements}
              onUpdateProductStock={handleUpdateProductStock}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionHistory
              transactions={transactions}
              settings={settings}
              onCancelTransaction={handleCancelTransaction}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              products={products}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleUpdateSettings}
              onResetData={() => {
                setProducts(getStoredProducts());
                setTransactions(getStoredTransactions());
                setSettings(getStoredSettings());
                setCart([]);
              }}
            />
          )}
        </div>

        {/* Footer Status Bar */}
        <FooterBar settings={settings} />
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          cart={cart}
          subtotal={cartSubtotal}
          discount={discount}
          taxEnabled={taxEnabled}
          taxRate={taxRate}
          taxAmount={taxAmount}
          totalAmount={cartTotal}
          settings={settings}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal (Thermal 58/80 mm + PDF Download) */}
      {completedReceiptTrx && (
        <ReceiptModal
          transaction={completedReceiptTrx}
          settings={settings}
          onClose={() => setCompletedReceiptTrx(null)}
          onNewTransaction={() => {
            setCompletedReceiptTrx(null);
            setActiveTab('dashboard');
          }}
        />
      )}

      {/* Slide-over Shopping Cart Drawer from the Right as requested */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Dark backdrop blur */}
          <div 
            onClick={() => setIsCartDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            title="Klik di luar untuk menutup keranjang"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-8 pointer-events-none">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-[#EDE8DB] pointer-events-auto animate-in slide-in-from-right duration-300">
              {/* Drawer Top Header with Close Button */}
              <div className="p-3.5 bg-[#0A261E] text-white flex items-center justify-between border-b border-[#133A2F]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D8A229]/20 border border-[#D8A229]/40 flex items-center justify-center text-[#E8C26E]">
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs font-serif-luxury tracking-wide text-white">
                      Keranjang Belanja Toko Hilal.art
                    </h3>
                    <p className="text-[10px] text-slate-300 font-sans">
                      {cartItemsCount} barang dipilih • Kasir: {settings.activeCashier}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Tutup Keranjang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Panel Inside Drawer */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <CartPanel
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  discount={discount}
                  onUpdateDiscount={setDiscount}
                  taxEnabled={taxEnabled}
                  taxRate={taxRate}
                  onToggleTax={() => setTaxEnabled(!taxEnabled)}
                  onOpenCheckout={() => {
                    setIsCartDrawerOpen(false);
                    setIsPaymentOpen(true);
                  }}
                  onQuickPrint={handleQuickPrintCart}
                  onQuickDownloadPDF={handleQuickDownloadPDFCart}
                  onLoadSampleCart={() => setCart(INITIAL_CART)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
