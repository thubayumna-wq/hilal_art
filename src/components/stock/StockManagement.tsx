import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  History, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Sliders, 
  Edit3, 
  Trash2, 
  X, 
  Filter,
  Plus
} from 'lucide-react';
import { Product, StockMovement, StoreSettings } from '../../types';
import { formatCurrency, formatDateIndonesian } from '../../utils/receiptGenerator';

interface StockManagementProps {
  products: Product[];
  settings: StoreSettings;
  stockMovements: StockMovement[];
  onUpdateProductStock: (
    productId: string, 
    type: 'in' | 'out' | 'adjustment', 
    quantity: number, 
    reason: string
  ) => void;
  onOpenEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  settings,
  stockMovements,
  onUpdateProductStock,
  onOpenEditProduct,
  onDeleteProduct,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'history'>('inventory');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'low' | 'out'>('all');

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Restok barang masuk dari distributor');

  // In-app Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());

    const matchCategory = filterCategory === 'all' || p.categoryId === filterCategory;

    let matchStatus = true;
    if (filterStatus === 'safe') matchStatus = p.stock > p.minStock;
    else if (filterStatus === 'low') matchStatus = p.stock <= p.minStock && p.stock > 0;
    else if (filterStatus === 'out') matchStatus = p.stock <= 0;

    return matchSearch && matchCategory && matchStatus;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustType('in');
    setAdjustQty('');
    setAdjustReason('Penerimaan restok barang dari distributor');
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Masukkan jumlah unit yang valid');
      return;
    }

    onUpdateProductStock(
      adjustingProduct.id,
      adjustType,
      qty,
      adjustReason.trim() || 'Penyesuaian stok manual'
    );
    setAdjustingProduct(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Manajemen Stok & Bahan Baku
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A261E] text-[#E8C26E] font-bold">
              {products.length} Item
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring ketersediaan bahan, stok minimum, penerimaan barang masuk, dan mutasi inventaris
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Stok Inventaris
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Mutasi ({stockMovements.length})
          </button>
        </div>
      </div>

      {/* KPI Stock Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Jenis Barang
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {products.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Stok Menipis (Perlu Restok)
            </span>
            <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
              {lowStockCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              Stok Habis (Kosong)
            </span>
            <div className="text-2xl font-extrabold text-red-600 font-mono mt-1">
              {outOfStockCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <X className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeSubTab === 'inventory' ? (
        <>
          {/* Search & Filters */}
          <div className="pb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode, nama produk, merek..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#0A261E] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-[#0A261E]"
              >
                <option value="all">Semua Status</option>
                <option value="safe">Status Aman</option>
                <option value="low">Status Menipis</option>
                <option value="out">Status Habis</option>
              </select>
            </div>
          </div>

          {/* Table matching user's screenshot layout */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Produk / Bahan</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Stok Saat Ini</th>
                    <th className="py-3 px-3">Stok Min</th>
                    <th className="py-3 px-3">Harga Modal / Satuan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStock && p.stock > 0;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Code (red-styled as seen in screenshot) */}
                        <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                          {p.code}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="text-slate-600 font-medium">
                            {p.categoryName || p.categoryId}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3.5 px-3 font-mono font-extrabold text-sm">
                          <span className={isOut ? 'text-red-600' : isLow ? 'text-red-500' : 'text-slate-900'}>
                            {p.stock} {p.unit}
                          </span>
                        </td>

                        {/* Min Stock */}
                        <td className="py-3.5 px-3 font-mono text-slate-500">
                          {p.minStock} {p.unit}
                        </td>

                        {/* Unit Cost */}
                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">
                          {formatCurrency(p.costPrice)} / {p.unit}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              ✕ Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ⚠ Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Aman
                            </span>
                          )}
                        </td>

                        {/* Actions matching screenshot */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Atur Stok Button */}
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#D8A229] hover:bg-[#C49221] text-[#0A261E] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Atur Stok</span>
                            </button>

                            {/* Edit */}
                            {onOpenEditProduct && (
                              <button
                                onClick={() => onOpenEditProduct(p)}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            {onDeleteProduct && (
                              <button
                                onClick={() => setProductToDelete(p)}
                                title="Hapus Produk Permanen"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Movement Log / Riwayat Mutasi */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Log Riwayat Keluar-Masuk Stok
            </h3>
            <span className="text-xs text-slate-500">
              Dicatat otomatis saat penjualan kasir atau penyesuaian admin
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-3">Jenis Mutasi</th>
                  <th className="py-3 px-3">Jumlah</th>
                  <th className="py-3 px-3">Stok Sebelum</th>
                  <th className="py-3 px-3">Stok Akhir</th>
                  <th className="py-3 px-4">Keterangan / Alasan</th>
                  <th className="py-3 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      Belum ada riwayat mutasi stok
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => {
                    const isIn = mov.type === 'in' || mov.type === 'return';
                    const isOut = mov.type === 'out' || mov.type === 'sale';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {formatDateIndonesian(mov.date)}
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">
                          {mov.productName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIn
                                ? 'bg-emerald-50 text-emerald-700'
                                : isOut
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                            ) : isOut ? (
                              <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Sliders className="w-3 h-3 text-amber-600" />
                            )}
                            {mov.type.toUpperCase()}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 font-bold text-sm ${
                            isIn ? 'text-emerald-700' : isOut ? 'text-blue-700' : 'text-slate-900'
                          }`}
                        >
                          {isIn ? `+${mov.quantity}` : isOut ? `-${mov.quantity}` : mov.quantity}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{mov.previousStock}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{mov.newStock}</td>
                        <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                          {mov.reason}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-500 text-[11px]">
                          {mov.recordedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal ("Atur Stok") */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#0A261E] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-serif-luxury tracking-wide">
                  Atur Penyesuaian Stok
                </h3>
                <p className="text-[11px] text-[#E8C26E] font-mono">
                  {adjustingProduct.code} • {adjustingProduct.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">Stok Saat Ini:</span>
                <span className="text-lg font-extrabold font-mono text-slate-900">
                  {adjustingProduct.stock} {adjustingProduct.unit}
                </span>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Jenis Perubahan Stok
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'in', label: 'Stok Masuk', desc: '+ Tambah' },
                    { id: 'out', label: 'Stok Keluar', desc: '- Kurang' },
                    { id: 'adjustment', label: 'Opname Fisik', desc: '= Set Nilai' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdjustType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        adjustType === t.id
                          ? 'border-[#0A261E] bg-[#0A261E] text-white shadow-xs font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{t.label}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  {adjustType === 'adjustment' ? 'Jumlah Stok Fisik Sekarang' : 'Jumlah Perubahan Unit'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 10"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full text-base font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Misal: Restok dari Faber-Castell / Rusak saat pengiriman"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white text-xs font-bold shadow-md shadow-[#0A261E]/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Produk Permanen?</h3>
                <p className="text-[11px] text-slate-500">Produk akan dihapus permanen dari inventaris dan kasir.</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={productToDelete.image}
                  alt={productToDelete.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs truncate">{productToDelete.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    SKU: {productToDelete.sku} • Stok: {productToDelete.stock} {productToDelete.unit}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Data produk ini tidak akan muncul lagi di kasir maupun etalase. Riwayat transaksi terdahulu tetap tersimpan dengan aman.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProduct && productToDelete) {
                    onDeleteProduct(productToDelete.id);
                    setProductToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
