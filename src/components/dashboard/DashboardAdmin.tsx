import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, StoreSettings, Transaction } from '../../types';
import { formatCurrency, formatDateIndonesian } from '../../utils/receiptGenerator';

interface DashboardAdminProps {
  products: Product[];
  transactions: Transaction[];
  settings: StoreSettings;
  onNavigateTab: (tab: any) => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  products,
  transactions,
  settings,
  onNavigateTab,
}) => {
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

  // Low & Out of stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  // Best selling products calculation
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
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Dashboard Admin HILALPOS
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D8A229] text-[#0A261E] font-bold">
              Hilal.art
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan performa penjualan, ketersediaan inventaris seni, dan aktivitas kasir hari ini
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white text-xs font-bold shadow-md shadow-[#0A261E]/20"
          >
            <ShoppingCart className="w-4 h-4 text-[#E8C26E]" />
            <span>Buka Kasir & Pilih Barang</span>
          </button>
        </div>
      </div>

      {/* Banner Pintasan Kasir & Pemilihan Barang */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0A261E] to-[#144234] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border border-[#D8A229]/30">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#D8A229]/20 border border-[#D8A229]/50 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-[#E8C26E]" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#FDFCF7]">
              Menu Kasir & Pemilihan Barang Belanja
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
              Pilih produk dari katalog seni (pensil, cat akrilik/air, kuas lukis, kanvas, sketchbook, gesso) dan masukkan ke keranjang belanja sebelum melanjutkan pembayaran.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('pos')}
          className="px-4 py-2.5 rounded-xl bg-[#D8A229] hover:bg-[#C99320] text-[#0A261E] font-bold text-xs flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95"
        >
          <span>Pilih Barang & Buka Kasir</span>
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

        {/* Estimasi Laba Bersih */}
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

      {/* Middle Row: Low Stock Alert + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alert Stok Menipis & Habis */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Peringatan Ketersediaan Stok
                </h3>
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

        {/* Produk Terlaris (Best Seller) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D8A229]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  5 Produk Seni Terlaris
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Lihat Laporan</span>
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
            <span>Kasir Aktif: {settings.activeCashier}</span>
            <span>Admin: {settings.adminName}</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">
            5 Transaksi Penjualan Terakhir
          </h3>
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
  );
};
