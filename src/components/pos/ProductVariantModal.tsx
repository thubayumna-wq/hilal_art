import React, { useState } from 'react';
import { X, ShoppingCart, CreditCard, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';

interface ProductVariantModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
  onInstantBuy: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
}

export const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
}) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    hasVariants ? product.variants![0] : undefined
  );
  const [selectedUnit, setSelectedUnit] = useState<string>(product.unit);
  const [quantity, setQuantity] = useState<number>(1);

  // Calculate current price based on variant or alt unit
  const currentPrice = selectedVariant ? selectedVariant.price : product.sellPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleIncrement = () => {
    if (quantity < currentStock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedVariant, quantity, selectedUnit);
    onClose();
  };

  const handleInstantBuyClick = () => {
    if (isOutOfStock) return;
    onInstantBuy(product, selectedVariant, quantity, selectedUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#0A261E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#E8C26E]" />
            <div>
              <h3 className="font-bold text-base font-serif-luxury tracking-wide">
                Pilih Barang & Masukkan ke Keranjang
              </h3>
              <p className="text-[11px] text-slate-300 font-sans">
                Tentukan varian dan jumlah beli untuk pesanan
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Product Overview Card */}
          <div className="flex gap-4 items-start pb-4 border-b border-slate-100">
            <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
              <img
                src={product.image}
                alt={product.name}
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
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D8A229]">
                {product.brand} • {product.categoryName || product.categoryId}
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {product.description}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#0A261E] font-mono tabular-nums">
                  {formatCurrency(currentPrice)}
                </span>
                <span className="text-xs text-slate-500">
                  / {selectedVariant?.unit || product.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Variant Selection (If product has variants) */}
          {hasVariants && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Pilih Jenis / Varian ({product.variants?.length} Pilihan):</span>
                {selectedVariant && (
                  <span className="text-[#0A261E] font-semibold text-xs lowercase">
                    stok: {selectedVariant.stock} {selectedVariant.unit}
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants!.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isVarOutOfStock = variant.stock <= 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (quantity > variant.stock && variant.stock > 0) {
                          setQuantity(variant.stock);
                        }
                      }}
                      disabled={isVarOutOfStock}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all relative ${
                        isSelected
                          ? 'border-[#0A261E] bg-[#0A261E]/5 ring-2 ring-[#D8A229] font-bold text-slate-900 shadow-xs'
                          : isVarOutOfStock
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{variant.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0A261E] shrink-0" />}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{formatCurrency(variant.price)}</span>
                        <span className={variant.stock <= 5 ? 'text-amber-600 font-bold' : ''}>
                          {isVarOutOfStock ? 'Habis' : `${variant.stock} ${variant.unit}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alternative Units / Wholesale (If available) */}
          {product.altUnits && product.altUnits.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilihan Satuan / Grosir:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedUnit(product.unit)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    selectedUnit === product.unit
                      ? 'border-[#0A261E] bg-[#0A261E] text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Satuan ({product.unit})
                </button>
                {product.altUnits.map((u, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedUnit(u.unit)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      selectedUnit === u.unit
                        ? 'border-[#0A261E] bg-[#0A261E] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {u.unit} - {formatCurrency(u.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Jumlah Beli
              </span>
              <span className="text-[11px] text-slate-500">
                Sisa stok tersedia: {currentStock} {selectedVariant?.unit || product.unit}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center font-bold text-lg text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-sm font-mono text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center font-bold text-lg text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Quantity Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Jumlah Cepat:</span>
            {[1, 2, 5, 10, 12].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (num <= currentStock) setQuantity(num);
                }}
                disabled={num > currentStock || isOutOfStock}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  quantity === num
                    ? 'bg-[#0A261E] text-white border-[#0A261E]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-30'
                }`}
              >
                +{num}
              </button>
            ))}
            {currentStock > 0 && (
              <button
                type="button"
                onClick={() => setQuantity(currentStock)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100"
              >
                Semua ({currentStock})
              </button>
            )}
          </div>

          {/* Subtotal preview */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 block">
                Total Belanja Barang Ini
              </span>
              <span className="text-[11px] text-slate-500">
                {quantity} {selectedVariant?.unit || product.unit} × {formatCurrency(currentPrice)}
              </span>
            </div>
            <span className="text-lg font-black text-[#0A261E] font-mono tabular-nums">
              {formatCurrency(currentPrice * quantity)}
            </span>
          </div>

          {isOutOfStock && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Maaf, stok varian ini sedang habis. Silakan pilih varian lain atau lakukan restok di menu Stok.</span>
            </div>
          )}
        </div>

        {/* Footer Actions: Primary Masukkan Keranjang + Secondary Bayar Langsung */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Masukkan Keranjang (Primary!) */}
          <button
            onClick={handleAddToCartClick}
            disabled={isOutOfStock}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ShoppingCart className="w-4 h-4 text-[#E8C26E]" />
            <span>+ Masukkan Keranjang</span>
          </button>

          {/* Bayar Langsung */}
          <button
            onClick={handleInstantBuyClick}
            disabled={isOutOfStock}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <CreditCard className="w-4 h-4 text-[#D8A229]" />
            <span>Bayar Langsung</span>
          </button>
        </div>
      </div>
    </div>
  );
};
