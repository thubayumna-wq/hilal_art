import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  Building2, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PaymentMethod, StoreSettings, Transaction } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';

interface PaymentModalProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  settings: StoreSettings;
  onClose: () => void;
  onPaymentSuccess: (transaction: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  cart,
  subtotal,
  discount,
  taxRate,
  taxAmount,
  totalAmount,
  settings,
  onClose,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [amountPaidStr, setAmountPaidStr] = useState<string>(totalAmount.toString());
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountPaidNum = parseInt(amountPaidStr, 10) || 0;
  const changeAmount = Math.max(0, amountPaidNum - totalAmount);
  const isCashInsufficient = paymentMethod === 'tunai' && amountPaidNum < totalAmount;

  // Preset cash values
  const quickCashPresets = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    100000,
    200000,
    500000,
  ].filter((v, idx, arr) => v >= totalAmount && arr.indexOf(v) === idx).slice(0, 5);

  const handleQuickCash = (val: number) => {
    setAmountPaidStr(val.toString());
  };

  const handleCompletePayment = () => {
    if (isSubmitting || isCashInsufficient) return;
    setIsSubmitting(true);

    try {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4A017', '#0A261E', '#F3C969', '#10B981']
      });
    } catch {
      // Ignore confetti issues if blocked
    }

    // Generate unique transaction invoice
    const dateNow = new Date();
    const dateCode = dateNow.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `TR-${dateCode}-${randomSuffix}`;

    const newTransaction: Transaction = {
      id: 'trx-' + Date.now(),
      invoiceNumber,
      date: dateNow.toISOString(),
      cashierName: settings.activeCashier,
      adminName: settings.adminName,
      customerName: customerName.trim() || 'Umum',
      items: [...cart],
      subtotal,
      discountAmount: discount,
      taxRate: taxAmount > 0 ? taxRate : 0,
      taxAmount,
      totalAmount,
      paymentMethod,
      amountPaid: paymentMethod === 'tunai' ? amountPaidNum : totalAmount,
      changeAmount: paymentMethod === 'tunai' ? changeAmount : 0,
      status: 'completed',
      notes: notes.trim() || undefined,
      isSynced: settings.isOnline,
    };

    setTimeout(() => {
      onPaymentSuccess(newTransaction);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#0A261E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#E8C26E]" />
            <div>
              <h3 className="font-bold text-base font-serif-luxury tracking-wide">
                Pembayaran Transaksi
              </h3>
              <p className="text-[11px] text-slate-300">
                Kasir: <strong className="text-[#E8C26E]">{settings.activeCashier}</strong> • Admin: {settings.adminName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Big Amount Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F382C] to-[#0A261E] text-white text-center shadow-md border border-[#19503F] relative overflow-hidden">
            <span className="text-xs uppercase font-medium tracking-widest text-[#D4A017] block">
              TOTAL TAGIHAN
            </span>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight mt-1">
              {formatCurrency(totalAmount)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-xs text-slate-300">
              <span>{cart.length} Jenis Barang</span>
              <span>•</span>
              <span>Diskon: {formatCurrency(discount)}</span>
              {taxAmount > 0 && (
                <>
                  <span>•</span>
                  <span>PPN: {formatCurrency(taxAmount)}</span>
                </>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'tunai' as PaymentMethod, label: 'Tunai', icon: Banknote },
                { id: 'qris' as PaymentMethod, label: 'QRIS', icon: QrCode },
                { id: 'transfer' as PaymentMethod, label: 'Transfer', icon: Building2 },
                { id: 'debit' as PaymentMethod, label: 'Debit', icon: CreditCard },
                { id: 'ewallet' as PaymentMethod, label: 'E-Wallet', icon: Smartphone },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id);
                      if (m.id !== 'tunai') {
                        setAmountPaidStr(totalAmount.toString());
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#0A261E] bg-[#0A261E] text-white shadow-sm ring-2 ring-[#D8A229]'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#E8C26E]' : 'text-slate-600'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method Details */}
          {paymentMethod === 'tunai' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Uang Diterima (Tunai)
              </label>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                {quickCashPresets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      amountPaidNum === val
                        ? 'bg-[#0A261E] text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {val === totalAmount ? 'Uang Pas' : formatCurrency(val)}
                  </button>
                ))}
              </div>

              {/* Custom Cash Input */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  value={amountPaidStr}
                  onChange={(e) => setAmountPaidStr(e.target.value)}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-lg font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>

              {/* Kembalian calculation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Kembalian:</span>
                <span
                  className={`font-mono font-extrabold text-base ${
                    isCashInsufficient ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {isCashInsufficient
                    ? `Kurang ${formatCurrency(totalAmount - amountPaidNum)}`
                    : formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-xl border-2 border-slate-800 shadow-xs flex flex-col items-center justify-center">
                {/* Simulated QR Code with Hilal.art Center Brand */}
                <div className="w-full h-full border border-dashed border-slate-300 p-2 flex flex-col items-center justify-between bg-slate-50/50">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    QRIS INDONESIA
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 p-2 bg-white rounded border border-slate-200">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-xs ${
                          (i * 7 + 3) % 2 === 0 ? 'bg-slate-900' : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-[#0A261E] font-serif-luxury">
                    HILAL.ART
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Pindai QRIS menggunakan BCA, Mandiri, GoPay, OVO, ShopeePay, atau DANA
              </p>
              <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block border border-emerald-200">
                Nominal Tepat: {formatCurrency(totalAmount)}
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Rekening Tujuan Toko Hilal.art:</p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-700">Bank BCA</span>
                  <p className="text-sm font-bold text-slate-900">014-982-4112</p>
                  <p className="text-[10px] text-slate-500">a.n. Hilal Art Supplies</p>
                </div>
                <span className="text-[11px] px-2 py-1 bg-slate-100 rounded text-slate-600">Salin</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-700">Bank Mandiri</span>
                  <p className="text-sm font-bold text-slate-900">139-00-8841-992</p>
                  <p className="text-[10px] text-slate-500">a.n. Hilal Art Supplies</p>
                </div>
                <span className="text-[11px] px-2 py-1 bg-slate-100 rounded text-slate-600">Salin</span>
              </div>
            </div>
          )}

          {/* Customer Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Kak Arya / Seniman"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0A261E]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                placeholder="Catatan tambahan di struk..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0A261E]"
              />
            </div>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={isSubmitting || isCashInsufficient}
            className="flex-1 py-3 px-5 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#E8C26E]" />
            <span>
              {isSubmitting ? 'Memproses...' : 'Selesaikan Pembayaran & Buat Struk'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
