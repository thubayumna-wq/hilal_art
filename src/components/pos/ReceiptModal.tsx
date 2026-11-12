import React, { useState } from 'react';
import { X, Printer, Download, PlusCircle, Check, Share2 } from 'lucide-react';
import { StoreSettings, Transaction } from '../../types';
import { downloadReceiptPDF, formatCurrency, formatDateIndonesian } from '../../utils/receiptGenerator';
import { GoldMonogramH } from '../common/GoldMonogramH';

interface ReceiptModalProps {
  transaction: Transaction;
  settings: StoreSettings;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
  onNewTransaction,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.receiptPaperWidth || '80mm');
  const [isCopied, setIsCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    downloadReceiptPDF(transaction, settings, paperWidth);
  };

  const handleCopyText = () => {
    const lines = [
      `*** ${settings.storeName.toUpperCase()} ***`,
      'HILALPOS — SATU SISTEM, SEMUA USAHA',
      settings.address,
      `Telp: ${settings.phone}`,
      '--------------------------------',
      `No. Trx : ${transaction.invoiceNumber}`,
      `Tanggal : ${formatDateIndonesian(transaction.date)}`,
      `Kasir   : ${transaction.cashierName || settings.activeCashier}`,
      `Admin   : ${transaction.adminName || settings.adminName}`,
      `Pelanggan: ${transaction.customerName || 'Umum'}`,
      '--------------------------------',
      ...transaction.items.map(
        (it) => `${it.name}${it.variantName ? ` (${it.variantName})` : ''}\n  ${it.quantity} ${it.unit} x ${formatCurrency(it.unitPrice)} = ${formatCurrency(it.subtotal)}`
      ),
      '--------------------------------',
      `Subtotal      : ${formatCurrency(transaction.subtotal)}`,
      transaction.discountAmount > 0 ? `Diskon        : -${formatCurrency(transaction.discountAmount)}` : null,
      transaction.taxAmount > 0 ? `Pajak (${(transaction.taxRate * 100).toFixed(0)}%)   : ${formatCurrency(transaction.taxAmount)}` : null,
      `TOTAL BELANJA : ${formatCurrency(transaction.totalAmount)}`,
      `Bayar (${transaction.paymentMethod.toUpperCase()}): ${formatCurrency(transaction.amountPaid)}`,
      `Kembalian     : ${formatCurrency(transaction.changeAmount)}`,
      '================================',
      settings.footerReceiptMsg,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Paper Selector */}
        <div className="p-4 bg-[#0A261E] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base font-serif-luxury tracking-wide flex items-center gap-2">
              <span>Struk Pembayaran Berhasil</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-300">
              No: <strong className="text-[#E8C26E] font-mono">{transaction.invoiceNumber}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 58mm / 80mm Switcher */}
            <div className="flex bg-[#143B2F] p-0.5 rounded-lg border border-[#215E4C]">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
                  paperWidth === '58mm'
                    ? 'bg-[#E8C26E] text-[#0A261E]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
                  paperWidth === '80mm'
                    ? 'bg-[#E8C26E] text-[#0A261E]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                80 mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Canvas (Alfamart / Thermal Style) */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex items-center justify-center flex-1">
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white p-5 shadow-lg border border-slate-300 text-slate-900 font-mono text-xs leading-relaxed transition-all duration-200 select-text relative"
          >
            {/* Header / Brand */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              {settings.showReceiptLogo && (
                <div className="flex justify-center mb-1">
                  <GoldMonogramH size={38} />
                </div>
              )}
              <h2 className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-600 font-sans uppercase tracking-widest font-semibold">
                HILALPOS — SATU SISTEM, SEMUA USAHA
              </p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[260px] mx-auto">
                {settings.address}
              </p>
              {settings.phone && (
                <p className="text-[10px] text-slate-600">
                  Telp: {settings.phone}
                </p>
              )}
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>No. Trx</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>{formatDateIndonesian(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span className="font-bold">{transaction.cashierName || settings.activeCashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin</span>
                <span className="font-bold">{transaction.adminName || settings.adminName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span>{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Item List */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-semibold text-slate-900 truncate">
                    {item.name}
                    {item.variantName && item.variantName !== item.name && (
                      <span className="text-slate-600 font-normal"> ({item.variantName})</span>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-600 pl-2">
                    <span>
                      {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b-2 border-slate-700 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>

              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(transaction.discountAmount)}</span>
                </div>
              )}

              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>PPN ({(transaction.taxRate * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(transaction.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dashed border-slate-300 text-slate-900">
                <span>TOTAL BELANJA</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>

              <div className="flex justify-between pt-1">
                <span>Bayar ({transaction.paymentMethod.toUpperCase()})</span>
                <span>{formatCurrency(transaction.amountPaid)}</span>
              </div>

              <div className="flex justify-between font-bold">
                <span>Kembalian</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Barcode & Closing Message */}
            <div className="pt-3 text-center space-y-2">
              {/* Simulated barcode */}
              <div className="flex justify-center items-center py-1">
                <div className="flex items-end gap-[1.5px] h-8">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div
                      key={i}
                      className={`bg-slate-900 ${
                        (i % 3 === 0 || i % 7 === 0) ? 'w-[2px]' : 'w-[1px]'
                      } ${(i * 13) % 2 === 0 ? 'h-8' : 'h-6'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest">
                *{transaction.invoiceNumber}*
              </p>

              <div className="text-[10px] text-slate-600 leading-tight pt-1">
                {settings.footerReceiptMsg.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Print Thermal Button */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white font-bold text-xs shadow-md transition-colors"
          >
            <Printer className="w-4 h-4 text-[#E8C26E]" />
            <span>Cetak Thermal ({paperWidth})</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#0A261E]" />
            <span>Unduh PDF</span>
          </button>

          {/* New Transaction */}
          <button
            onClick={onNewTransaction}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#D8A229] hover:bg-[#C49221] text-[#0A261E] font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#0A261E]" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
