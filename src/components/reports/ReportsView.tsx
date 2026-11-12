import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  FileDown, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Award, 
  PieChart, 
  Printer, 
  Tag, 
  CreditCard 
} from 'lucide-react';
import { Product, StoreSettings, Transaction } from '../../types';
import { exportTransactionsToCSV, formatCurrency } from '../../utils/receiptGenerator';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  products,
  settings,
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter completed transactions by period
  const filteredTrx = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'completed');
    if (period === 'all') return completed;

    const now = new Date();
    return completed.filter((t) => {
      const d = new Date(t.date);
      if (period === 'today') {
        return d.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return d >= sevenDaysAgo;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate stats
  const totalRevenue = filteredTrx.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalSubtotal = filteredTrx.reduce((sum, t) => sum + t.subtotal, 0);
  const totalDiscount = filteredTrx.reduce((sum, t) => sum + t.discountAmount, 0);
  const totalTax = filteredTrx.reduce((sum, t) => sum + t.taxAmount, 0);
  const totalCost = filteredTrx.reduce(
    (sum, t) => sum + t.items.reduce((s, it) => s + (it.costPrice || 0) * it.quantity, 0),
    0
  );
  const netProfit = Math.max(0, totalRevenue - totalCost);
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const averageTransaction = filteredTrx.length > 0 ? Math.round(totalRevenue / filteredTrx.length) : 0;

  // Breakdown by Category
  const categorySales: Record<string, { name: string; amount: number; qty: number }> = {};
  filteredTrx.forEach((trx) => {
    trx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const catName = prod?.categoryName || 'Lainnya';
      if (!categorySales[catName]) {
        categorySales[catName] = { name: catName, amount: 0, qty: 0 };
      }
      categorySales[catName].amount += item.subtotal;
      categorySales[catName].qty += item.quantity;
    });
  });

  const categoryList = Object.values(categorySales).sort((a, b) => b.amount - a.amount);

  // Breakdown by Cashier
  const cashierSales: Record<string, { name: string; amount: number; count: number }> = {};
  filteredTrx.forEach((trx) => {
    const name = trx.cashierName || 'Kasir';
    if (!cashierSales[name]) cashierSales[name] = { name, amount: 0, count: 0 };
    cashierSales[name].amount += trx.totalAmount;
    cashierSales[name].count += 1;
  });

  // Breakdown by Payment Method
  const methodSales: Record<string, { method: string; amount: number; count: number }> = {};
  filteredTrx.forEach((trx) => {
    const m = trx.paymentMethod;
    if (!methodSales[m]) methodSales[m] = { method: m, amount: 0, count: 0 };
    methodSales[m].amount += trx.totalAmount;
    methodSales[m].count += 1;
  });

  // Product sales ranking
  const productRanking: Record<string, { name: string; brand: string; qty: number; revenue: number; cost: number }> = {};
  filteredTrx.forEach((trx) => {
    trx.items.forEach((item) => {
      if (!productRanking[item.productId]) {
        productRanking[item.productId] = {
          name: item.name,
          brand: item.brand,
          qty: 0,
          revenue: 0,
          cost: 0,
        };
      }
      productRanking[item.productId].qty += item.quantity;
      productRanking[item.productId].revenue += item.subtotal;
      productRanking[item.productId].cost += (item.costPrice || 0) * item.quantity;
    });
  });

  const topProducts = Object.values(productRanking).sort((a, b) => b.qty - a.qty);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Laporan Penjualan & Keuangan
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A261E] text-[#E8C26E] font-bold">
              {settings.storeName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis laba-rugi, efisiensi kasir, produk seni terlaris, dan rekapitulasi pembayaran
          </p>
        </div>

        {/* Period filter + CSV export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'week', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportTransactionsToCSV(filteredTrx)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Omset Penjualan
          </span>
          <div className="text-2xl font-extrabold text-[#0A261E] font-mono mt-1">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredTrx.length} Transaksi Berhasil
          </p>
        </div>

        {/* Estimasi Laba Bersih */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Estimasi Laba Kotor
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatCurrency(netProfit)}
          </div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-1">
            Margin Keuntungan: {profitMargin}%
          </p>
        </div>

        {/* Nilai Transaksi Rata-Rata */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata Keranjang (AOV)
          </span>
          <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {formatCurrency(averageTransaction)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Per struk belanja pelanggan
          </p>
        </div>

        {/* Pajak PPN & Diskon */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Pajak PPN & Diskon
          </span>
          <div className="text-lg font-bold text-slate-800 font-mono mt-1">
            PPN: {formatCurrency(totalTax)}
          </div>
          <p className="text-[11px] text-red-600 mt-0.5">
            Diskon Diberikan: {formatCurrency(totalDiscount)}
          </p>
        </div>
      </div>

      {/* Middle Row: Category Breakdown + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Penjualan per Kategori */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#D8A229]" />
              <span>Penjualan per Kategori Seni</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {categoryList.length} Kategori
            </span>
          </div>

          <div className="space-y-3">
            {categoryList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi</p>
            ) : (
              categoryList.map((cat) => {
                const percent = totalSubtotal > 0 ? (cat.amount / totalSubtotal) * 100 : 0;
                return (
                  <div key={cat.name} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-[11px]">{cat.qty} unit</span>
                        <strong className="text-slate-900">{formatCurrency(cat.amount)}</strong>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0A261E] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Penjualan per Metode Pembayaran & Kasir */}
        <div className="space-y-5">
          {/* Metode Pembayaran */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Metode Pembayaran</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.values(methodSales).map((m) => (
                <div key={m.method} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {m.method}
                  </span>
                  <div className="font-mono font-bold text-sm text-[#0A261E] mt-1">
                    {formatCurrency(m.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {m.count} Transaksi
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aktivitas per Kasir */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Penjualan per Kasir
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {Object.values(cashierSales).map((c) => (
                <div key={c.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="text-slate-400 text-[11px]">({c.count} struk)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Ranking Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D8A229]" />
            <span>Daftar Peringkat Penjualan Produk</span>
          </h3>
          <span className="text-xs text-slate-400">
            Diurutkan berdasarkan kuantitas terjual
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <th className="py-2.5">No</th>
                <th className="py-2.5">Nama Produk</th>
                <th className="py-2.5">Merek</th>
                <th className="py-2.5 text-right font-mono">Qty Terjual</th>
                <th className="py-2.5 text-right font-mono">Total Omset</th>
                <th className="py-2.5 text-right font-mono">Total Modal</th>
                <th className="py-2.5 text-right font-mono">Laba Kotor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {topProducts.map((p, idx) => {
                const profit = p.revenue - p.cost;
                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 font-sans font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 font-sans text-slate-600">{p.brand}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{p.qty}</td>
                    <td className="py-2.5 text-right text-slate-800">{formatCurrency(p.revenue)}</td>
                    <td className="py-2.5 text-right text-slate-500">{formatCurrency(p.cost)}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      {formatCurrency(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
