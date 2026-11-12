import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Sparkles, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Trash2,
  Tag,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';
import { Category, Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';
import { compressImageFile } from '../../utils/imageOptimizer';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  categories,
}) => {
  // Preset photos gallery
  const PRESET_GALLERY = [
    { label: 'Tombow Mono Zero Eraser', url: '/assets/products/shopee/tombow_mono_zero.jpg' },
    { label: 'V-TEC Palet Oval Putih', url: '/assets/products/shopee/vtec_palet_oval.jpg' },
    { label: 'Bantex SketchBook Spiral', url: '/assets/products/shopee/bantex_sketchbook.jpg' },
    { label: 'Pentel GraphGear 1000', url: '/assets/products/shopee/pentel_graphgear.jpg' },
    { label: 'Touch Mark Alcohol Marker', url: '/assets/products/shopee/touchmark_marker.jpg' },
    { label: 'Penghapus Dust-Free FC', url: '/assets/products/shopee/fc_dust_free.jpg' },
    { label: 'Pensil FC Castell 9000', url: '/assets/products/shopee/fc_castell_9000.jpg' },
    { label: 'Giorgione 27pcs Sketsa', url: '/assets/products/shopee/giorgione_27sketch.jpg' },
    { label: 'Giorgione Akrilik 75ml', url: '/assets/products/shopee/giorgione_ac75.jpg' },
    { label: 'Joyko Art Brush BRS-18', url: '/assets/products/shopee/joyko_art_brush.jpg' },
    { label: 'Faber-Castell Polychromos', url: '/assets/products/shopee/fc_polychromos.jpg' },
    { label: 'Isi Pensil Mekanik 2B', url: '/assets/products/shopee/lead_refill_2b.jpg' },
    { label: 'Set 5 Spatula Lukis', url: '/assets/products/shopee/spatula_lukis_5set.jpg' },
    { label: 'Kuas Detail Line Art', url: '/assets/products/shopee/kuas_detail_line.jpg' },
    { label: 'Giorgione Cat Tube 12ml', url: '/assets/products/shopee/giorgione_tube_set.jpg' },
    { label: 'Drawing Gloves 2 Jari', url: '/assets/products/shopee/drawing_gloves.jpg' },
    { label: 'Pensil Graphite 2B Set', url: '/assets/products/fc_pencil_2b.png' },
    { label: 'Cat Akrilik Mont Marte', url: '/assets/products/mt_acrylic_24.png' },
    { label: 'Cat Air Winsor & Newton', url: '/assets/products/wn_watercolor_12.png' },
    { label: 'Kanvas Cotton 40x60', url: '/assets/products/canvas_cotton_4060.png' },
    { label: 'Kuas Lukis Set 12', url: '/assets/products/kuas_lukis_12.png' },
    { label: 'Gesso Acrylic 1000ml', url: '/assets/products/gesso_acrylic_1000.png' },
    { label: 'Oil Pastel 36 Warna', url: '/assets/products/oil_pastel_36.png' },
    { label: 'Sketchbook Spiral A5', url: '/assets/products/sketchbook_a5.png' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editingProduct?.name || '');
  const [brand, setBrand] = useState(editingProduct?.brand || 'Hilal.art');
  const [categoryId, setCategoryId] = useState(editingProduct?.categoryId || 'pensil-sketsa');
  const [sellPrice, setSellPrice] = useState<string>(editingProduct ? String(editingProduct.sellPrice) : '15000');
  const [costPrice, setCostPrice] = useState<string>(editingProduct ? String(editingProduct.costPrice) : '10000');
  const [stock, setStock] = useState<string>(editingProduct ? String(editingProduct.stock) : '50');
  const [minStock, setMinStock] = useState<string>(editingProduct ? String(editingProduct.minStock) : '5');
  const [unit, setUnit] = useState(editingProduct?.unit || 'Pcs');
  const [image, setImage] = useState(editingProduct?.image || PRESET_GALLERY[0].url);
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [sku, setSku] = useState(editingProduct?.sku || '');
  const [barcode, setBarcode] = useState(editingProduct?.barcode || '');
  const [variants, setVariants] = useState<ProductVariant[]>(editingProduct?.variants || []);

  const [showPresets, setShowPresets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // New variant temporary inputs
  const [varName, setVarName] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('');

  // Auto-generate SKU & Barcode if empty
  const handleGenerateSKU = () => {
    const brandPrefix = (brand || 'HLA').substring(0, 3).toUpperCase();
    const namePrefix = (name || 'ART').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Math.floor(100 + Math.random() * 900);
    setSku(`HLA-${brandPrefix}-${namePrefix}-${random}`);
  };

  const handleGenerateBarcode = () => {
    const randomBarcode = '899' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(randomBarcode);
  };

  // Image File Upload Handler with instant compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File yang dipilih harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Ukuran gambar terlalu besar. Maksimal 15 MB.');
      return;
    }

    setErrorMessage(null);
    setIsCompressing(true);

    try {
      // Compress to high-quality thumbnail (approx 30KB - 60KB) to ensure permanent storage without quota issues
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.82);
      setImage(compressedDataUrl);
    } catch (err) {
      console.warn('Gagal kompresi gambar, menggunakan fallback reader', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddVariant = () => {
    if (!varName.trim()) return;
    const priceNum = parseInt(varPrice, 10) || parseInt(sellPrice, 10) || 0;
    const stockNum = parseInt(varStock, 10) || 10;
    const newVar: ProductVariant = {
      id: 'var-' + Date.now(),
      name: varName.trim(),
      sku: `${sku || 'HLA'}-${varName.toUpperCase().replace(/\s+/g, '')}`,
      barcode: '899' + Math.floor(1000000000 + Math.random() * 9000000000),
      price: priceNum,
      costPrice: parseInt(costPrice, 10) || 0,
      stock: stockNum,
      minStock: 5,
      unit: unit || 'Pcs',
    };
    setVariants([...variants, newVar]);
    setVarName('');
    setVarPrice('');
    setVarStock('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama barang wajib diisi!');
      return;
    }

    if (!image.trim()) {
      setErrorMessage('Foto barang wajib diunggah atau dipilih!');
      return;
    }

    const sellPriceNum = parseInt(sellPrice, 10) || 0;
    const costPriceNum = parseInt(costPrice, 10) || 0;
    const stockNum = parseInt(stock, 10) || 0;
    const minStockNum = parseInt(minStock, 10) || 5;

    const catObj = categories.find((c) => c.id === categoryId);

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-user-${Date.now()}`,
      code: editingProduct ? editingProduct.code : `HL-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      brand: brand.trim() || 'Hilal.art',
      categoryId: categoryId || 'pensil-sketsa',
      categoryName: catObj ? catObj.name : 'Perlengkapan Seni',
      description: description.trim() || `${name.trim()} berkualitas untuk seniman dan pelajar.`,
      image: image.trim(),
      unit: unit.trim() || 'Pcs',
      sellPrice: sellPriceNum,
      costPrice: costPriceNum,
      stock: stockNum,
      minStock: minStockNum,
      sku: sku.trim() || `HLA-${(brand || 'ART').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      barcode: barcode.trim() || ('899' + Math.floor(1000000000 + Math.random() * 9000000000)),
      isActive: true,
      variants: variants.length > 0 ? variants : undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      ...( { isCustom: true } as any ),
    };

    onSave(productPayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-[#E8E2D2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A261E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D8A229] text-[#0A261E] flex items-center justify-center font-black shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif-luxury tracking-wide flex items-center gap-2">
                {editingProduct ? 'Ubah Foto & Nama Barang' : 'Tambah Produk & Foto Baru'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8C26E]/20 text-[#E8C26E] font-sans font-bold">
                  Hilal.art
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {editingProduct 
                  ? 'Perbarui foto asli, nama, varian, dan harga jual barang'
                  : 'Unggah foto produk, isi nama barang, dan tampilkan langsung di toko'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. SEKSI FOTO PRODUK */}
          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#EBE4D5] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#D8A229]" />
                <span>Foto Produk Barang (Wajib)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs font-bold text-[#0A261E] hover:text-[#184F40] underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D8A229]" />
                <span>{showPresets ? 'Tutup Pilihan Foto Preset' : 'Pilih dari Galeri Foto Seni'}</span>
              </button>
            </div>

            {/* Photo Preview & Upload Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white border-2 border-dashed border-[#D6CEBC] overflow-hidden relative group shrink-0 flex items-center justify-center shadow-xs">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Preview Produk"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.failed) {
                          target.dataset.failed = 'true';
                          target.src = '/assets/products/shopee/fc_dust_free.jpg';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Ganti Foto
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] block">Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Upload Action Buttons */}
              <div className="flex-1 space-y-2.5 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2.5 rounded-xl bg-[#0A261E] hover:bg-[#154437] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 ${
                      isCompressing ? 'opacity-70 cursor-wait' : ''
                    }`}
                  >
                    {isCompressing ? (
                      <RefreshCw className="w-4 h-4 text-[#D8A229] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#D8A229]" />
                    )}
                    <span>{isCompressing ? 'Mengoptimalkan foto...' : 'Upload Foto dari HP / Komputer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D6CEBC] text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Pilih Foto Seni Asli</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Atau masukkan URL gambar langsung:</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... atau /assets/products/..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D6CEBC] bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#D8A229]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Mendukung file JPG, PNG, WEBP hingga 5MB. Foto yang jelas akan menarik lebih banyak pembeli!
                </p>
              </div>
            </div>

            {/* Expandable Preset Gallery */}
            {showPresets && (
              <div className="mt-3 p-3 bg-white rounded-2xl border border-[#D6CEBC] space-y-2 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-slate-700">Pilih dari Galeri Foto Produk Hilal.art:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {PRESET_GALLERY.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImage(item.url);
                        setShowPresets(false);
                      }}
                      className={`group rounded-xl border p-1 text-left transition-all relative flex flex-col items-center ${
                        image === item.url
                          ? 'border-[#0A261E] bg-[#0A261E]/5 ring-2 ring-[#D8A229]'
                          : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-white mb-1">
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] text-slate-700 font-medium truncate w-full text-center">
                        {item.label}
                      </span>
                      {image === item.url && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0A261E] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. SEKSI INFORMASI UTAMA PRODUK */}
          <div className="space-y-4">
            {/* Nama Produk */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Nama Barang / Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Tombow MONO zero Precision Eraser / Cat Akrilik 75ml..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#D6CEBC] bg-white text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0A261E] shadow-2xs"
              />
            </div>

            {/* Merek & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Merek / Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Faber-Castell, Tombow, Pentel, Mont Marte, dll"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D6CEBC] text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Faber-Castell', 'Tombow', 'Pentel', 'Bantex', 'Mont Marte', 'Hilal.art'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Kategori Produk
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D6CEBC] text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                >
                  {categories.filter((c) => c.id !== 'semua').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Harga Jual, Modal, Stok, Satuan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    min="0"
                    required
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-[#D6CEBC] text-xs font-bold text-[#0A261E] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Harga Modal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    min="0"
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-[#D6CEBC] text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Stok Awal
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#D6CEBC] text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Pcs, Set, Tube, dll"
                  className="w-full px-3 py-2 rounded-xl border border-[#D6CEBC] text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>
            </div>

            {/* Deskripsi Barang */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Keterangan / Deskripsi Barang
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Spesifikasi, keunggulan, ukuran detail barang..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#D6CEBC] text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
              />
            </div>

            {/* SKU & Barcode Generator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Kode SKU</label>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="text-[10px] text-[#0A261E] font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="HLA-TMB-MNZ-101"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D6CEBC] text-xs font-mono text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Nomor Barcode</label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[10px] text-[#0A261E] font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto Barcode</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="8992345678901"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D6CEBC] text-xs font-mono text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A261E]"
                />
              </div>
            </div>

            {/* 3. SEKSI VARIAN PRODUK (OPSIONAL) */}
            <div className="pt-2 border-t border-[#EBE4D5]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Varian Ukuran / Warna ({variants.length} Varian)
                  </span>
                  <p className="text-[10px] text-slate-400">Contoh: White Round, White Flat, 12 Warna, 24 Warna, dll.</p>
                </div>
              </div>

              {/* Existing Variants List */}
              {variants.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {variants.map((v) => (
                    <div 
                      key={v.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{v.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-[#0A261E] font-bold">{formatCurrency(v.price)}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium">Stok: {v.stock} {v.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Variant Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#FAF8F3] p-2.5 rounded-xl border border-[#EBE4D5]">
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Nama varian..."
                  className="sm:col-span-2 px-3 py-1.5 text-xs rounded-lg border border-[#D6CEBC] bg-white text-slate-800"
                />
                <input
                  type="number"
                  value={varPrice}
                  onChange={(e) => setVarPrice(e.target.value)}
                  placeholder={`Harga (default Rp ${sellPrice})`}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D6CEBC] bg-white text-slate-800 font-mono"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={varStock}
                    onChange={(e) => setVarStock(e.target.value)}
                    placeholder="Stok"
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#D6CEBC] bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-lg bg-[#0A261E] text-white text-xs font-bold hover:bg-[#154437] shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-4 border-t border-[#EBE4D5] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D6CEBC] text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A261E] to-[#164E3E] text-[#E8C26E] hover:from-[#113B2F] hover:to-[#1C604D] text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 text-[#D8A229]" />
              <span>{editingProduct ? 'Simpan Perubahan' : 'Simpan & Tampilkan di Toko'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
