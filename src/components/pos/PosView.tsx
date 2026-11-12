import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ScanBarcode, 
  Plus, 
  Check, 
  Layers,
  Palette,
  Brush,
  Image as ImageIcon,
  BookOpen,
  Pencil,
  ChevronRight,
  ChevronLeft,
  FileText,
  Zap,
  Flame,
  Star,
  Sparkles,
  ArrowUpDown,
  Tag,
  Gift,
  Store,
  MapPin,
  Clock,
  SlidersHorizontal,
  Camera
} from 'lucide-react';
import { Category, Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';
import { ProductVariantModal } from './ProductVariantModal';
import { ProductFormModal } from '../products/ProductFormModal';

interface PosViewProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
  onInstantBuy: (product: Product, variant?: ProductVariant, quantity?: number, selectedUnit?: string) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  categories,
  onAddToCart,
  onInstantBuy,
  onAddProduct,
  onUpdateProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [sortBy, setSortBy] = useState<'terkait' | 'terbaru' | 'terlaris' | 'harga-rendah' | 'harga-tinggi'>('terkait');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showBarcodeScannerNotice, setShowBarcodeScannerNotice] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Flash Sale Countdown (Counts down HH:MM:SS)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 3, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Banner Carousel rotation
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, []);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Icon mapping for categories
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'pensil-sketsa': return Pencil;
      case 'cat-pewarna': return Palette;
      case 'kuas-lukis': return Brush;
      case 'kanvas': return ImageIcon;
      case 'sketchbook': return BookOpen;
      case 'kertas-gambar': return FileText;
      default: return Layers;
    }
  };

  // Shopee Circular 10 Quick Icons
  const shopeeQuickIcons = [
    { id: 'flash-sale', label: 'Flash Sale', icon: Zap, color: 'bg-gradient-to-br from-amber-500 to-red-500 text-white', categoryId: 'semua' },
    { id: 'pensil-sketsa', label: 'Pensil & Sketsa', icon: Pencil, color: 'bg-emerald-100 text-emerald-800', categoryId: 'pensil-sketsa' },
    { id: 'cat-pewarna', label: 'Cat & Pewarna', icon: Palette, color: 'bg-purple-100 text-purple-800', categoryId: 'cat-pewarna' },
    { id: 'kuas-lukis', label: 'Kuas Lukis', icon: Brush, color: 'bg-amber-100 text-amber-800', categoryId: 'kuas-lukis' },
    { id: 'kanvas', label: 'Kanvas Lukis', icon: ImageIcon, color: 'bg-blue-100 text-blue-800', categoryId: 'kanvas' },
    { id: 'sketchbook', label: 'Sketchbook', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800', categoryId: 'sketchbook' },
    { id: 'kertas-gambar', label: 'Kertas Seni', icon: FileText, color: 'bg-teal-100 text-teal-800', categoryId: 'kertas-gambar' },
    { id: 'alat-lukis', label: 'Gesso & Medium', icon: Sparkles, color: 'bg-rose-100 text-rose-800', categoryId: 'alat-lukis' },
    { id: 'terlaris', label: 'Paling Laris', icon: Star, color: 'bg-yellow-100 text-yellow-800', categoryId: 'semua', sort: 'terlaris' as const },
    { id: 'paket-pemula', label: 'Paket Seniman', icon: Gift, color: 'bg-green-100 text-green-800', categoryId: 'semua' },
  ];

  // Promotional Banner Data
  const promoBanners = [
    {
      title: 'HILAL.ART SUPER ART FAIR 🎨',
      tagline: 'Diskon Perlengkapan Seni s/d 40% • Pensil Grafit, Cat Akrilik & Kanvas Siap Kirim',
      badge: 'PROMO SPESIAL SENIMAN',
      gradient: 'from-[#0A261E] via-[#124235] to-[#1C5C4B]',
      accentColor: 'text-[#E8C26E]',
    },
    {
      title: 'Koleksi Kuas Lukis & Watercolor Asli ✨',
      tagline: 'Winsor & Newton Cotman & Mont Marte Series • 100% Produk Original Bergaransi',
      badge: 'OFFICIAL STORE',
      gradient: 'from-[#1A332B] via-[#0E2E23] to-[#234B3B]',
      accentColor: 'text-[#F6D07A]',
    },
    {
      title: 'Gratis Hadiah Setiap Belanja Kanvas 🖼️',
      tagline: 'Setiap pembelian Kanvas Cotton 40x60 cm bonus palet lukis atau kuas detail',
      badge: 'BONUS LANGSUNG',
      gradient: 'from-[#283E34] via-[#143B2C] to-[#0D2E21]',
      accentColor: 'text-[#E5B242]',
    },
  ];

  // Flash Sale Items (Curated from the 8 primary products)
  const flashSaleItems = useMemo(() => {
    return products.slice(0, 5).map((p, idx) => {
      const discountPercents = [28, 20, 15, 25, 22];
      const discountPct = discountPercents[idx % discountPercents.length];
      const originalPrice = Math.round(p.sellPrice / (1 - discountPct / 100));
      return {
        ...p,
        discountPct,
        originalPrice,
        soldPct: 65 + (idx * 7) % 30,
      };
    });
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (!p.isActive) return false;

      const matchesCategory =
        selectedCategory === 'semua' || p.categoryId === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(query);
      const matchBrand = p.brand.toLowerCase().includes(query);
      const matchSku = p.sku.toLowerCase().includes(query);
      const matchBarcode = p.barcode.includes(query);
      const matchType = p.type?.toLowerCase().includes(query) || false;
      const matchVariants = p.variants?.some(
        (v) => v.name.toLowerCase().includes(query) || v.sku.toLowerCase().includes(query) || v.barcode.includes(query)
      );

      return matchName || matchBrand || matchSku || matchBarcode || matchType || matchVariants;
    });

    // Sort products
    if (sortBy === 'harga-rendah') {
      result = [...result].sort((a, b) => a.sellPrice - b.sellPrice);
    } else if (sortBy === 'harga-tinggi') {
      result = [...result].sort((a, b) => b.sellPrice - a.sellPrice);
    } else if (sortBy === 'terbaru') {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === 'terlaris') {
      result = [...result].sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Click card: always open selection menu modal so user can pick variant and quantity
  const handleCardClick = (product: Product) => {
    setActiveModalProduct(product);
  };

  // Quick (+) button click: if variants exist open modal, otherwise quick add 1 unit
  const handleQuickPlusClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.variants && product.variants.length > 0) {
      setActiveModalProduct(product);
    } else {
      onAddToCart(product);
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 800);
    }
  };

  // Barcode Scan Simulator
  const handleBarcodeScanSim = () => {
    if (products.length > 0) {
      const target = products[Math.floor(Math.random() * products.length)];
      setSearchQuery(target.barcode);
      setShowBarcodeScannerNotice(true);
      setTimeout(() => setShowBarcodeScannerNotice(false), 2500);
    }
  };

  const handleScrollCategoriesRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleScrollCategoriesLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 flex flex-col bg-[#FAF8F3] select-none pb-28"
    >
      {/* 1. Shopee Top Search Bar & Quick Add Product (Scrolls with page) */}
      <div className="p-3.5 sm:p-4 pb-2.5 bg-[#FAF8F3] shrink-0 border-b border-[#EBE4D5]/70">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari perlengkapan seni... (Nama, Pensil 2H-9B, Cat, Kuas, Kanvas, Barcode)"
              className="w-full pl-12 pr-12 py-3 rounded-2xl border border-[#E5DFCF] bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#B88424] shadow-xs transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            ) : null}

            {/* Barcode Scan Icon Button */}
            <button
              onClick={handleBarcodeScanSim}
              title="Scan Barcode Produk"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-[#0A261E] transition-colors p-1 cursor-pointer"
            >
              <ScanBarcode className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Button to Add New Product & Photo directly from the store dashboard */}
          {onAddProduct && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductFormOpen(true);
              }}
              title="Tambah produk baru & upload foto"
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0A261E] to-[#154437] hover:from-[#113B2F] hover:to-[#1B5746] text-[#E8C26E] text-xs font-bold flex items-center gap-2 shadow-md shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#D8A229]" />
              <span className="hidden sm:inline">+ Tambah Foto & Barang</span>
              <span className="sm:hidden">+ Barang</span>
            </button>
          )}
        </div>

        {showBarcodeScannerNotice && (
          <div className="mt-2.5 max-w-4xl mx-auto text-xs text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Barcode scanner aktif: Memindai produk otomatis!</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full px-3.5 sm:px-4 space-y-4 pt-3">
        {/* 2. Shopee Carousel Promo Banner Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#D8A229]/30 transition-all">
          <div className={`p-5 sm:p-6 bg-gradient-to-r ${promoBanners[bannerIndex].gradient} text-white flex flex-col justify-between min-h-[140px] sm:min-h-[160px] relative`}>
            {/* Background art flourish */}
            <div className="absolute right-3 top-2 opacity-15 pointer-events-none">
              <Brush className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D8A229] text-[#0A261E] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                {promoBanners[bannerIndex].badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-serif-luxury tracking-wide text-white leading-tight">
                {promoBanners[bannerIndex].title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-lg leading-relaxed">
                {promoBanners[bannerIndex].tagline}
              </p>
            </div>

            {/* Bottom dot indicators & CTA */}
            <div className="flex items-center justify-between pt-3 relative z-10">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setBannerIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      bannerIndex === idx ? 'w-6 bg-[#D8A229]' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-bold text-[#E8C26E] flex items-center gap-1">
                <span>Belanja Sekarang</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Shopee 10-Circle Quick-Action Menu */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#EDE7D9] shadow-xs">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 text-center">
            {shopeeQuickIcons.map((item) => {
              const Icon = item.icon;
              const isSelected = item.categoryId !== 'semua' && selectedCategory === item.categoryId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.categoryId) setSelectedCategory(item.categoryId);
                    if (item.sort) setSortBy(item.sort);
                  }}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                >
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${
                    isSelected ? 'ring-2 ring-[#0A261E] ring-offset-1 font-bold' : ''
                  }`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] mt-1.5 line-clamp-1 leading-tight ${
                    isSelected ? 'font-bold text-[#0A261E]' : 'text-slate-700'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Shopee FLASH SALE Bar with Live Countdown Timer */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F2] to-[#FFF9F0] border border-[#FFD9CC] shadow-xs">
          {/* Flash sale header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#FFE2D6]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs tracking-wider shadow-2xs">
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>FLASH SALE</span>
              </div>

              {/* Countdown Clocks */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-slate-900">:</span>
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-slate-900">:</span>
                <span className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('semua');
                setSortBy('terlaris');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Flash Sale Horizontal Scrollable Cards */}
          <div className="flex items-center gap-3 overflow-x-auto pt-3 pb-1 scrollbar-none">
            {flashSaleItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="w-32 sm:w-36 bg-white rounded-xl border border-[#FFE2D6] p-2 shrink-0 cursor-pointer hover:shadow-md transition-all active:scale-95 relative flex flex-col justify-between"
              >
                {/* Discount Tag */}
                <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-extrabold shadow-xs">
                  -{item.discountPct}%
                </div>

                {/* Thumbnail */}
                <div className="w-full aspect-square rounded-lg bg-[#FAF7F0] overflow-hidden mb-2">
                  <img
                    src={item.image}
                    alt={item.name}
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

                {/* Title & Price */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 truncate">
                    {item.name}
                  </h4>
                  <div className="text-xs font-black text-red-600 font-mono mt-0.5">
                    {formatCurrency(item.sellPrice)}
                  </div>
                  <div className="text-[9px] text-slate-400 line-through font-mono">
                    {formatCurrency(item.originalPrice)}
                  </div>

                  {/* Progress Bar Shopee Style */}
                  <div className="mt-1.5 w-full bg-red-100 rounded-full h-3 overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                      style={{ width: `${item.soldPct}%` }}
                    />
                    <span className="relative z-10 text-[8px] font-black text-white uppercase tracking-wider">
                      TERJUAL {item.soldPct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Shopee Middle Store Banner */}
        <div className="rounded-2xl overflow-hidden shadow-xs border border-[#E8E2D2] bg-white">
          <img
            src="/assets/products/banner_hilal_art.png"
            alt="Hilal.art — Tempat Terbaik untuk Para Seniman"
            className="w-full h-auto object-cover max-h-24 sm:max-h-28"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.dataset.failed) {
                target.dataset.failed = 'true';
                target.src = '/assets/products/banner_hilal_art.png';
              }
            }}
          />
        </div>

        {/* 6. Shopee Category Pills & Sort Tabs Bar (Scrolls naturally) */}
        <div className="space-y-2 pt-1 bg-[#FAF8F3] py-2">
          {/* Category Horizontal Chips Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleScrollCategoriesLeft}
              className="hidden sm:flex w-7 h-7 rounded-full bg-white border border-[#E8E2D2] hover:bg-slate-50 items-center justify-center text-slate-700 shadow-xs shrink-0"
              title="Kategori sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div 
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1"
            >
              {/* Semua */}
              <button
                onClick={() => setSelectedCategory('semua')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                  selectedCategory === 'semua'
                    ? 'bg-[#0A261E] text-white shadow-[#0A261E]/20'
                    : 'bg-white border border-[#E8E2D2] text-slate-700 hover:bg-[#F2ECE0]'
                }`}
              >
                <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                  <span className="bg-current rounded-xs" />
                  <span className="bg-current rounded-xs" />
                  <span className="bg-current rounded-xs" />
                  <span className="bg-current rounded-xs" />
                </div>
                <span>Semua Produk ({products.length})</span>
              </button>

              {/* Individual Categories */}
              {categories
                .filter((c) => c.id !== 'semua')
                .map((cat) => {
                  const Icon = getCategoryIcon(cat.id);
                  const isSelected = selectedCategory === cat.id;
                  const catCount = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                        isSelected
                          ? 'bg-[#0A261E] text-white shadow-[#0A261E]/20'
                          : 'bg-white border border-[#E8E2D2] text-slate-700 hover:bg-[#F2ECE0]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.name}</span>
                      {catCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {catCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={handleScrollCategoriesRight}
              className="w-7 h-7 rounded-full bg-white border border-[#E8E2D2] hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs shrink-0"
              title="Kategori berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shopee Sort Tabs */}
          <div className="flex items-center justify-between text-xs border-b border-[#E8E2D2] pb-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Urutkan:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'terkait' as const, label: 'Terkait' },
                { id: 'terbaru' as const, label: 'Terbaru' },
                { id: 'terlaris' as const, label: 'Terlaris' },
                { id: 'harga-rendah' as const, label: 'Harga ⬆' },
                { id: 'harga-tinggi' as const, label: 'Harga ⬇' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    sortBy === tab.id
                      ? 'bg-[#D8A229] text-[#0A261E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Shopee 2x4 Product Catalog Grid (Scrolls Continuously) */}
        <div>
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Produk Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada barang yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('semua');
                  setSortBy('terkait');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0A261E] text-white text-xs font-semibold hover:bg-[#133A2F]"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
              {/* Card 0: Quick Add Product & Upload Photo Card */}
              {onAddProduct && !searchQuery && selectedCategory === 'semua' && (
                <div
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductFormOpen(true);
                  }}
                  className="bg-gradient-to-b from-[#F9F7F1] via-white to-[#F2EFE8] rounded-2xl border-2 border-dashed border-[#D6CEBC] hover:border-[#0A261E] hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center p-4 text-center cursor-pointer group active:scale-[0.985] relative min-h-[280px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A261E] to-[#164E3E] text-[#D8A229] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D8A229]/20 text-[#0A261E] font-extrabold uppercase tracking-wider mb-1">
                    Tambah Barang
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#0A261E] leading-snug">
                    + Upload Foto & Nama Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 max-w-[150px] leading-tight">
                    Unggah foto dari HP/PC, beri nama & harga toko
                  </p>
                  <button
                    type="button"
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#0A261E] text-[#E8C26E] text-xs font-bold shadow-xs group-hover:bg-[#164E3E] transition-colors"
                  >
                    Buka Form
                  </button>
                </div>
              )}

              {filteredProducts.map((product, idx) => {
                const isOut = product.stock <= 0;
                const isJustAdded = justAddedId === product.id;
                const hasVariants = product.variants && product.variants.length > 0;
                const isPromo = idx < 8; // Promo discount simulation for the 8 primary products

                return (
                  <div
                    key={product.id}
                    onClick={() => handleCardClick(product)}
                    className="bg-white rounded-2xl border border-[#EDE8DB] hover:border-[#D6CEBC] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group active:scale-[0.985] relative"
                  >
                    {/* Top Shopee Badges: Mall/Star + Discount + Quick Edit */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#D8A229] text-[#0A261E] text-[9px] font-black tracking-tight shadow-xs">
                        STAR+
                      </span>
                    </div>

                    {/* Quick Edit Button (Pencil Icon) to change photo & name directly */}
                    {onUpdateProduct && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                          setIsProductFormOpen(true);
                        }}
                        title="Ubah Foto & Nama Barang Ini"
                        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#0A261E] border border-[#E8E2D2] shadow-sm flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#0A261E]" />
                      </button>
                    )}

                    {isPromo && !onUpdateProduct && (
                      <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-extrabold shadow-xs">
                        -{15 + (idx * 3) % 20}%
                      </div>
                    )}

                    {/* Photo area with rounded top */}
                    <div className="w-full aspect-square bg-[#FAF7F0] overflow-hidden relative border-b border-[#F4EFE4]">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = '/assets/products/shopee/fc_dust_free.jpg';
                          }
                        }}
                      />
                    </div>

                    {/* Body Content matching screenshot & Shopee aesthetic */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#0A261E]">
                          {product.name}
                        </h3>

                        {/* Spec line: Pcs • SKU: FC-PEN-2B */}
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                          {product.unit} • SKU: {product.sku}
                        </p>

                        {/* Shopee Rating & Terjual */}
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                          <div className="flex items-center text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-bold ml-0.5">4.9</span>
                          </div>
                          <span>•</span>
                          <span>{120 + idx * 15}+ terjual</span>
                        </div>

                        {/* Toko Origin Badge */}
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Hilal.art Banyumas</span>
                        </div>
                      </div>

                      {/* Price, Stock and Plus Button */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-end justify-between">
                        <div>
                          {/* Price */}
                          <div className="font-extrabold text-sm sm:text-base font-mono text-[#0D382B] tabular-nums">
                            {formatCurrency(product.sellPrice)}
                          </div>

                          {/* Stock with green checkmark */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Stok: {product.stock}</span>
                          </div>
                        </div>

                        {/* Round dark green (+) button */}
                        <button
                          onClick={(e) => handleQuickPlusClick(e, product)}
                          disabled={isOut}
                          title={hasVariants ? "Pilih varian & jumlah" : "Tambah cepat 1 pcs ke keranjang"}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white scale-110'
                              : isOut
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-[#0A261E] hover:bg-[#133A2F] text-white shadow-xs group-hover:scale-105'
                          }`}
                        >
                          {isJustAdded ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom store footer note */}
        <div className="pt-8 pb-12 text-center text-slate-400 text-xs">
          <p className="font-bold text-slate-600">Hilal.art — Satu Sistem, Semua Usaha</p>
          <p className="mt-1">Menampilkan {filteredProducts.length} dari total {products.length} perlengkapan seni berkualitas</p>
        </div>
      </div>

      {/* Modal for product variant & quantity selection */}
      {activeModalProduct && (
        <ProductVariantModal
          product={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onAddToCart={onAddToCart}
          onInstantBuy={onInstantBuy}
        />
      )}

      {/* Modal for adding or editing product photo & name */}
      {isProductFormOpen && (
        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={(productPayload) => {
            if (editingProduct && onUpdateProduct) {
              onUpdateProduct(productPayload);
            } else if (onAddProduct) {
              onAddProduct(productPayload);
            }
          }}
          editingProduct={editingProduct}
          categories={categories}
        />
      )}
    </div>
  );
};
