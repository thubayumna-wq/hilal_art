import React, { useState } from 'react';
import { 
  Store, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  DollarSign, 
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Category, CartItem, Product, ProductVariant, StoreSettings, Transaction } from '../../types';
import { PosView } from '../pos/PosView';
import { CartPanel } from '../pos/CartPanel';
import { formatCurrency, formatDateIndonesian } from '../../utils/receiptGenerator';

interface StoreDashboardViewProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  discount: number;
  taxEnabled: boolean;
  taxRate: number;
  settings: StoreSettings;
  transactions: Transaction[];
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
  onInstantBuy: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onUpdateDiscount: (amount: number) => void;
  onToggleTax: () => void;
  onOpenCheckout: () => void;
  onQuickPrint: () => void;
  onQuickDownloadPDF: () => void;
  onLoadSampleCart: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenCart?: () => void;
  initialMode?: 'pos' | 'analytics';
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
}

export const StoreDashboardView: React.FC<StoreDashboardViewProps> = ({
  products,
  categories,
  cart,
  discount,
  taxEnabled,
  taxRate,
  settings,
  transactions,
  onAddToCart,
  onInstantBuy,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onUpdateDiscount,
  onToggleTax,
  onOpenCheckout,
  onQuickPrint,
  onQuickDownloadPDF,
  onLoadSampleCart,
  onNavigateTab,
  onOpenCart,
  initialMode = 'pos',
  onAddProduct,
  onUpdateProduct,
}) => {
  const [dashboardMode, setDashboardMode] = useState<'pos' | 'analytics'>(initialMode);
  const [showCartPanel, setShowCartPanel] = useState<boolean>(false);

  const completedTransactions = transactions.filter((t) => t.status === 'completed');

  // Today's metrics
  const todayStr = new Date().toDateString();
  const todayTrx = completedTransactions.filter(
    (t) => new Date(t.date).toDateString() === todayStr
  );
  const todaySales = todayTrx.reduce((sum, t) => sum + t.totalAmount, 0);

  // Overall metrics
  const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalCost = completedTransactions.reduce(
    (sum, t) => sum + t.items.reduce((s, it) => s + (it.costPrice || 0) * it.quantity, 0),
    0
  );
  const estimatedProfit = Math.max(0, totalRevenue - totalCost);
  const totalItemsSold = completedTransactions.reduce(
    (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  // Low stock counts
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  // Best selling products
  const salesByProduct: Record<string, { product: Product; qty: number; totalRev: number }> = {};
  completedTransactions.forEach((trx) => {
    trx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        if (!salesByProduct[prod.id]) {
          salesByProduct[prod.id] = { product: prod, qty: 0, totalRev: 0 };
        }
        salesByProduct[prod.id].qty += item.quantity;
        salesByProduct[prod.id].totalRev += item.subtotal;
      }
    });
  });

  const bestSellers = Object.values(salesByProduct)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentTrx = [...completedTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F3]">
      {/* Top Store Control Strip (Dashboard Toko Hilal.art - scrolls with page) */}
      <div className="px-5 py-2.5 bg-[#FAF7F0] border-b border-[#E8E2D2] flex flex-wrap items-center justify-between gap-3 shrink-0 select-none shadow-xs">
        {/* Left: Store identity & real-time badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0A261E] text-[#E8C26E] flex items-center justify-center font-bold shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide font-serif-luxury">
                Dashboard Toko Hilal.art
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                Shift Buka ({settings.activeCashier})
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pusat Operasional Toko Perlengkapan Seni, Alat Lukis & Sketsa
            </p>
          </div>
        </div>

        {/* Center: Live Store KPI Pills */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D2] flex items-center gap-2 shadow-2xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Penjualan Hari Ini:</span>
            <span className="font-extrabold font-mono text-[#0A261E]">
              {formatCurrency(todaySales)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D2] flex items-center gap-2 shadow-2xs">
            <Package className="w-3.5 h-3.5 text-[#D8A229]" />
            <span className="text-slate-500">Katalog:</span>
            <span className="font-extrabold text-slate-800">
              {products.length} Barang
            </span>
          </div>

          {lowStockProducts.length + outOfStockProducts.length > 0 && (
            <div 
              onClick={() => onNavigateTab('stock')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold">{lowStockProducts.length + outOfStockProducts.length} Stok Kritis</span>
            </div>
          )}
        </div>

        {/* Right: Mode Switcher (Etalase Kasir vs Statistik Toko) */}
        <div className="flex items-center gap-1.5 bg-[#EDE6D6] p-1 rounded-xl border border-[#DFD7C4]">
          <button
            onClick={() => setDashboardMode('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dashboardMode === 'pos'
                ? 'bg-[#0A261E] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShoppingCart className={`w-3.5 h-3.5 ${dashboardMode === 'pos' ? 'text-[#E8C26E]' : 'text-slate-600'}`} />
            <span>Etalase Kasir & Pilih Barang</span>
          </button>

          <button
            onClick={() => setDashboardMode('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dashboardMode === 'analytics'
                ? 'bg-[#0A261E] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${dashboardMode === 'analytics' ? 'text-[#E8C26E]' : 'text-slate-600'}`} />
            <span>Statistik Toko</span>
          </button>

          {/* Toggle Cart Visibility Button */}
          {dashboardMode === 'pos' && (
            <button
              onClick={() => {
                if (onOpenCart) onOpenCart();
                else setShowCartPanel(!showCartPanel);
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#DFD7C4] shadow-2xs transition-all ml-1 cursor-pointer"
              title="Buka keranjang belanja"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#0A261E]" />
              <span>Keranjang</span>
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-mono flex items-center justify-center font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace based on Active Mode */}
      {dashboardMode === 'pos' ? (
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 relative">
          {/* Shopee-Style Catalog View matching user photo */}
          <PosView
            products={products}
            categories={categories}
            onAddToCart={onAddToCart}
            onInstantBuy={onInstantBuy}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
          />

          {/* Right Shopping Cart Panel (Inline if showCartPanel is true) */}
          {showCartPanel && (
            <div className="shrink-0 h-full border-l border-[#EDE8DB] bg-white animate-in slide-in-from-right-4 duration-150">
              <CartPanel
                cart={cart}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onClearCart={onClearCart}
                discount={discount}
                onUpdateDiscount={onUpdateDiscount}
                taxEnabled={taxEnabled}
                taxRate={taxRate}
                onToggleTax={onToggleTax}
                onOpenCheckout={onOpenCheckout}
                onQuickPrint={onQuickPrint}
                onQuickDownloadPDF={onQuickDownloadPDF}
                onLoadSampleCart={onLoadSampleCart}
              />
            </div>
          )}

          {/* Floating Cart Button for Mobile or Quick Access */}
          {!showCartPanel && (
            <button
              onClick={() => {
                if (onOpenCart) onOpenCart();
                else setShowCartPanel(true);
              }}
              className="fixed bottom-10 right-6 z-30 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0A261E] text-white shadow-xl hover:bg-[#133A2F] border-2 border-[#D8A229] transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-[#E8C26E]" />
              <span className="font-bold text-xs">Keranjang Belanja</span>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </button>
          )}
        </div>
      ) : (
        /* Analytics / Summary Mode */
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-[#FAF9F5] select-none">
          {/* Header Action Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0A261E] to-[#144234] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border border-[#D8A229]/30">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#D8A229]/20 border border-[#D8A229]/50 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-[#E8C26E]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#FDFCF7]">
                  Ringkasan Operasional & Kinerja Hilal.art
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                  Pantau penjualan harian, barang terlaris, dan stok kritis secara real-time. Klik tombol di kanan untuk langsung beralih ke etalase kasir untuk melayani pembelian.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDashboardMode('pos')}
              className="px-4 py-2.5 rounded-xl bg-[#D8A229] hover:bg-[#C99320] text-[#0A261E] font-bold text-xs flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Etalase & Pilih Barang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Penjualan Hari Ini */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Penjualan Hari Ini
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#0A261E] font-mono mt-2">
                {formatCurrency(todaySales)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {todayTrx.length} Transaksi Selesai Hari Ini
              </p>
            </div>

            {/* Total Omset Keseluruhan */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Omset Penjualan
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dari total {completedTransactions.length} transaksi tercatat
              </p>
            </div>

            {/* Estimasi Laba Kotor */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Estimasi Laba Kotor
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-blue-800 font-mono mt-2">
                {formatCurrency(estimatedProfit)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Selisih harga jual dan harga modal barang
              </p>
            </div>

            {/* Produk Terjual */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Produk Terjual
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-purple-900 font-mono mt-2">
                {totalItemsSold} <span className="text-xs font-sans font-normal text-slate-500">Unit</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {products.length} katalog perlengkapan aktif
              </p>
            </div>
          </div>

          {/* Row 2: Stok Kritis + Produk Terlaris */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Alert Stok */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Peringatan Ketersediaan Stok
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('stock')}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Kelola Stok</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      ✓ Semua stok barang dalam kondisi aman di atas batas minimum.
                    </div>
                  ) : (
                    <>
                      {outOfStockProducts.map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <p className="text-[11px] text-slate-500">{p.brand} • {p.code}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            Habis (0 {p.unit})
                          </span>
                        </div>
                      ))}

                      {lowStockProducts.map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <p className="text-[11px] text-slate-500">{p.brand} • {p.code}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Tersisa {p.stock} {p.unit} (Min {p.minStock})
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Stok menipis: {lowStockProducts.length}</span>
                <span>Stok habis: {outOfStockProducts.length}</span>
              </div>
            </div>

            {/* Produk Terlaris */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D8A229]" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      5 Produk Seni Terlaris
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('reports')}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Laporan Lengkap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {bestSellers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Belum ada data penjualan tercatat.
                    </div>
                  ) : (
                    bestSellers.map((item, idx) => (
                      <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-[#0A261E] font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="w-9 h-9 rounded-lg bg-slate-50 overflow-hidden border border-slate-200 shrink-0">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.product.name}</p>
                            <p className="text-[11px] text-slate-500">{item.product.brand}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-slate-900 block">
                            {item.qty} {item.product.unit}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatCurrency(item.totalRev)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Kasir Bertugas: {settings.activeCashier}</span>
                <span>Admin: {settings.adminName}</span>
              </div>
            </div>
          </div>

          {/* Riwayat 5 Transaksi Terakhir */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                5 Transaksi Penjualan Terakhir
              </h4>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Semua Riwayat Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <th className="py-2.5">No. Invoice</th>
                    <th className="py-2.5">Waktu</th>
                    <th className="py-2.5">Kasir</th>
                    <th className="py-2.5">Pelanggan</th>
                    <th className="py-2.5">Metode</th>
                    <th className="py-2.5 text-right font-mono">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTrx.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{trx.invoiceNumber}</td>
                      <td className="py-2.5 text-slate-500">{formatDateIndonesian(trx.date)}</td>
                      <td className="py-2.5 font-medium">{trx.cashierName}</td>
                      <td className="py-2.5 text-slate-600">{trx.customerName || 'Umum'}</td>
                      <td className="py-2.5 uppercase font-semibold text-[11px] text-slate-700">{trx.paymentMethod}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#0A261E]">
                        {formatCurrency(trx.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
