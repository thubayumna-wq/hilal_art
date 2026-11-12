import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  Printer, 
  Download, 
  RotateCcw, 
  Eye, 
  Filter, 
  Calendar, 
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  FileDown
} from 'lucide-react';
import { StoreSettings, Transaction } from '../../types';
import { downloadReceiptPDF, exportTransactionsToCSV, formatCurrency, formatDateIndonesian } from '../../utils/receiptGenerator';
import { ReceiptModal } from '../pos/ReceiptModal';

interface TransactionHistoryProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onCancelTransaction: (transactionId: string, reason: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  settings,
  onCancelTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterTime, setFilterTime] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<Transaction | null>(null);

  // Return / Cancel Modal
  const [returningTrx, setReturningTrx] = useState<Transaction | null>(null);
  const [cancelReason, setCancelReason] = useState('Pelanggan salah beli ukuran / ganti produk');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (t.customerName && t.customerName.toLowerCase().includes(search.toLowerCase())) ||
        t.cashierName.toLowerCase().includes(search.toLowerCase());

      const matchMethod = filterMethod === 'all' || t.paymentMethod === filterMethod;

      let matchTime = true;
      if (filterTime !== 'all') {
        const trxDate = new Date(t.date);
        const now = new Date();
        if (filterTime === 'today') {
          matchTime = trxDate.toDateString() === now.toDateString();
        } else if (filterTime === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchTime = trxDate >= sevenDaysAgo;
        } else if (filterTime === 'month') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchTime = trxDate >= thirtyDaysAgo;
        }
      }

      return matchSearch && matchMethod && matchTime;
    });
  }, [transactions, search, filterMethod, filterTime]);

  // Aggregate Metrics
  const totalCompletedAmount = filteredTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const completedCount = filteredTransactions.filter((t) => t.status === 'completed').length;
  const averageBasket = completedCount > 0 ? Math.round(totalCompletedAmount / completedCount) : 0;

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningTrx) return;
    onCancelTransaction(returningTrx.id, cancelReason);
    setReturningTrx(null);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'tunai': return Banknote;
      case 'qris': return QrCode;
      case 'transfer': return Building2;
      default: return CreditCard;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Riwayat Transaksi Penjualan
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A261E] text-[#E8C26E] font-bold">
              {transactions.length} Transaksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data transaksi kasir Hilal.art, cetak ulang struk thermal, unduh invoice PDF, dan retur barang
          </p>
        </div>

        <button
          onClick={() => exportTransactionsToCSV(filteredTransactions)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
        >
          <FileDown className="w-4 h-4 text-slate-600" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Omset / Pendapatan
          </span>
          <div className="text-2xl font-extrabold text-[#0A261E] font-mono mt-1">
            {formatCurrency(totalCompletedAmount)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Transaksi Berhasil
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {completedCount} Trx
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Rata-rata Nilai Belanja (AOV)
          </span>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {formatCurrency(averageBasket)}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="pb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor struk, pelanggan, kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#0A261E] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Time Filter */}
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value as any)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-[#0A261E]"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-[#0A261E]"
          >
            <option value="all">Semua Metode</option>
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
            <option value="debit">Kartu Debit</option>
            <option value="ewallet">E-Wallet</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Kasir & Admin</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3">Item Belanja</th>
                <th className="py-3 px-3 font-mono">Total Transaksi</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    Tidak ada transaksi yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const PayIcon = getPaymentIcon(trx.paymentMethod);
                  const isCancelled = trx.status === 'cancelled' || trx.status === 'refunded';

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {trx.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDateIndonesian(trx.date)}
                      </td>

                      {/* Cashier & Admin */}
                      <td className="py-3 px-3 text-[11px]">
                        <span className="font-bold text-slate-800 block">
                          Kasir: {trx.cashierName || settings.activeCashier}
                        </span>
                        <span className="text-slate-400 block">
                          Admin: {trx.adminName || settings.adminName}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {trx.customerName || 'Umum'}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <PayIcon className="w-3.5 h-3.5 text-slate-600" />
                          <span className="uppercase">{trx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Items preview */}
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {trx.items.length} Barang (
                        {trx.items.map((it) => `${it.quantity} ${it.name}`).join(', ')}
                        )
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                        <span className={isCancelled ? 'line-through text-slate-400' : 'text-[#0A261E]'}>
                          {formatCurrency(trx.totalAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {trx.status === 'completed' ? '✓ Selesai' : '✕ Dibatalkan / Retur'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Struk / Cetak Ulang */}
                          <button
                            onClick={() => setSelectedReceiptTrx(trx)}
                            title="Buka / Cetak Struk"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-[#0A261E] hover:bg-slate-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct PDF Download */}
                          <button
                            onClick={() => downloadReceiptPDF(trx, settings)}
                            title="Unduh Struk PDF"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Retur / Cancel if not cancelled yet */}
                          {!isCancelled && (
                            <button
                              onClick={() => setReturningTrx(trx)}
                              title="Batalkan / Retur Transaksi"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View / Reprint Receipt */}
      {selectedReceiptTrx && (
        <ReceiptModal
          transaction={selectedReceiptTrx}
          settings={settings}
          onClose={() => setSelectedReceiptTrx(null)}
          onNewTransaction={() => setSelectedReceiptTrx(null)}
        />
      )}

      {/* Return / Cancel Dialog */}
      {returningTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-red-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Batalkan Transaksi / Retur Barang</h3>
              <button
                onClick={() => setReturningTrx(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Anda akan membatalkan transaksi <strong className="font-mono text-slate-900">{returningTrx.invoiceNumber}</strong> senilai <strong className="font-mono text-[#0A261E]">{formatCurrency(returningTrx.totalAmount)}</strong>.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                💡 Seluruh item barang dalam transaksi ini akan dikembalikan (stok otomatis bertambah kembali).
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Alasan Pembatalan / Retur:
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Misal: Salah beli barang / Barang cacat pabrik"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturningTrx(null)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Konfirmasi Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
