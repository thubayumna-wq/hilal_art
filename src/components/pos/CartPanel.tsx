import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  X, 
  Plus, 
  Minus, 
  CreditCard, 
  ArrowRight,
  Printer,
  Download,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';

interface CartPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  discount: number;
  onUpdateDiscount: (amount: number) => void;
  taxEnabled: boolean;
  taxRate: number;
  onToggleTax: () => void;
  onOpenCheckout: () => void;
  onQuickPrint?: () => void;
  onQuickDownloadPDF?: () => void;
  onLoadSampleCart?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  discount,
  taxEnabled,
  taxRate,
  onOpenCheckout,
  onQuickPrint,
  onQuickDownloadPDF,
  onLoadSampleCart,
}) => {
  const [waNotice, setWaNotice] = useState(false);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = taxEnabled ? Math.round(taxableSubtotal * taxRate) : 0;
  const total = taxableSubtotal + taxAmount;

  const handleShareWhatsApp = () => {
    if (cart.length === 0) return;
    const itemsList = cart
      .map((it) => `- ${it.name} (${it.quantity} ${it.unit}) : ${formatCurrency(it.subtotal)}`)
      .join('%0A');
    const msg = `*PESANAN HILAL.ART*%0A%0A${itemsList}%0A%0ASubtotal: ${formatCurrency(subtotal)}%0APajak (11%): ${formatCurrency(taxAmount)}%0A*Total: ${formatCurrency(total)}*%0A%0ATerima kasih atas pesanan Anda di Hilal.art!`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    setWaNotice(true);
    setTimeout(() => setWaNotice(false), 2000);
  };

  return (
    <aside className="w-full lg:w-[380px] bg-white border-l border-[#EDE8DB] flex flex-col justify-between shrink-0 h-full shadow-xs select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#F0EBE0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h2 className="font-extrabold text-[#0D382B] text-base">
            Keranjang Belanja
          </h2>
          {cart.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A261E] text-white font-bold font-mono">
              {cart.reduce((s, i) => s + i.quantity, 0)} item
            </span>
          )}
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            title="Kosongkan Keranjang"
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-white">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-amber-50/80 border-2 border-dashed border-[#D8A229]/40 flex items-center justify-center text-[#B58525] mb-4">
              <ShoppingCart className="w-9 h-9" />
            </div>
            <p className="font-extrabold text-slate-800 text-sm">
              Keranjang Masih Kosong
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
              Silakan pilih barang pada katalog di sebelah kiri lalu klik tombol <span className="font-bold text-[#0A261E]">(+)</span> atau pilih varian untuk dimasukkan ke keranjang belanja.
            </p>

            {onLoadSampleCart && (
              <button
                onClick={onLoadSampleCart}
                className="mt-5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8B6214] bg-[#FFF8EB] border border-[#F0D59B] hover:bg-[#FCEFD2] transition-colors"
              >
                + Muat 3 Contoh Barang
              </button>
            )}
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-2xl bg-white border border-[#EFE9DC] hover:border-slate-300 transition-all flex items-center gap-3 relative group"
            >
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-[#FAF8F3] overflow-hidden shrink-0 border border-[#F2ECE0]">
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.failed) {
                      target.dataset.failed = 'true';
                      target.src = '/assets/products/shopee/fc_dust_free.jpg';
                    }
                  }}
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.quantity} {item.unit} • {formatCurrency(item.unitPrice)}
                </p>

                {/* Stepper */}
                <div className="mt-1.5 flex items-center border border-slate-200 rounded-lg w-fit bg-slate-50">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold font-mono text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.availableStock}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Subtotal & Delete */}
              <div className="text-right shrink-0">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="font-bold text-xs font-mono text-slate-900 mt-4">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Section matching screenshot */}
      <div className="p-4 bg-white border-t border-[#F0EBE0] space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Subtotal</span>
          <span className="font-mono font-bold text-slate-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Diskon</span>
          <span className="font-mono font-bold text-slate-900">
            {discount > 0 ? `-${formatCurrency(discount)}` : 'Rp 0'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Pajak ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-mono font-bold text-slate-900">
            {taxEnabled ? formatCurrency(taxAmount) : 'Rp 0'}
          </span>
        </div>

        {/* Total Pembayaran (Cream/Yellow Highlighted Container) */}
        <div className="p-3.5 rounded-2xl bg-[#FFF6E5] border border-[#FDE6B8] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Total Pembayaran
          </span>
          <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Big Yellow CTA Button: "Bayar Sekarang ->" */}
        <button
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all ${
            cart.length === 0
              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#E5B242] hover:bg-[#DCA432] text-[#0A261E] active:scale-[0.98] cursor-pointer'
          }`}
        >
          {cart.length === 0 ? (
            <>
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <span className="tracking-wide">Pilih Barang di Katalog Terlebih Dahulu</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span className="tracking-wide">Bayar Sekarang</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>

        {/* 4 Bottom Action Buttons matching user screenshot */}
        <div className="pt-2 grid grid-cols-4 gap-2 text-center">
          {/* Cetak Struk */}
          <button
            onClick={onQuickPrint || onOpenCheckout}
            disabled={cart.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span className="text-[10px] text-slate-600 mt-1 font-semibold leading-tight">
              Cetak Struk
            </span>
          </button>

          {/* Unduh PDF */}
          <button
            onClick={onQuickDownloadPDF || onOpenCheckout}
            disabled={cart.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span className="text-[10px] text-slate-600 mt-1 font-semibold leading-tight">
              Unduh PDF
            </span>
          </button>

          {/* Kirim WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            disabled={cart.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] text-slate-600 mt-1 font-semibold leading-tight">
              Kirim WhatsApp
            </span>
          </button>

          {/* Reset */}
          <button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4 text-slate-700" />
            <span className="text-[10px] text-slate-600 mt-1 font-semibold leading-tight">
              Reset
            </span>
          </button>
        </div>

        {waNotice && (
          <p className="text-[10px] text-center text-emerald-700 font-semibold">
            Ringkasan pesanan dibuka di WhatsApp!
          </p>
        )}
      </div>
    </aside>
  );
};
