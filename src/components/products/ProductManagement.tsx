import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Power, 
  FileDown, 
  X, 
  Check, 
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Category, Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';
import { compressImageFile } from '../../utils/imageOptimizer';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'safe' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // In-app Delete Confirmation State (No window.confirm!)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Photo Tab in Modal: 'upload' | 'preset' | 'url'
  const [photoSourceTab, setPhotoSourceTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    code: '',
    name: '',
    brand: '',
    categoryId: categories[1]?.id || 'pensil-sketsa',
    series: '',
    type: 'Peralatan Seni',
    description: '',
    image: '/assets/products/shopee/tombow_mono_zero.jpg',
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    sku: '',
    barcode: '',
    isActive: true,
    variants: [],
  });

  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('');

  // Sample photo gallery choices for quick selection
  const SAMPLE_IMAGES = [
    { label: 'Pensil Graphite 2B Set', url: '/assets/products/fc_pencil_2b.png' },
    { label: 'Cat Akrilik Mont Marte', url: '/assets/products/mt_acrylic_24.png' },
    { label: 'Kuas Lukis Set 12', url: '/assets/products/kuas_lukis_12.png' },
    { label: 'Kanvas Cotton 40x60', url: '/assets/products/canvas_cotton_4060.png' },
    { label: 'Sketchbook Spiral A5', url: '/assets/products/sketchbook_a5.png' },
    { label: 'Pensil Warna Faber-Castell', url: '/assets/products/shopee/fc_polychromos.jpg' },
    { label: 'Cat Air Pan 12 Warna', url: '/assets/products/wn_watercolor_12.png' },
    { label: 'Palet Lukis & Warna', url: '/assets/products/shopee/vtec_palet_oval.jpg' },
    { label: 'Oil Pastel Crayon', url: '/assets/products/oil_pastel_36.png' },
    { label: 'Gesso & Medium Lukis', url: '/assets/products/gesso_acrylic_1000.png' },
    { label: 'Kertas Kanson & Watercolor', url: '/assets/products/sketchbook_a5.png' },
    { label: 'Drawing Pen & Lettering', url: '/assets/products/shopee/pentel_graphgear.jpg' },
    { label: 'Penghapus Dust-Free FC', url: '/assets/products/shopee/fc_dust_free.jpg' },
    { label: 'Tombow Mono Zero Eraser', url: '/assets/products/shopee/tombow_mono_zero.jpg' },
    { label: 'Giorgione 27pcs Sketsa', url: '/assets/products/shopee/giorgione_27sketch.jpg' },
    { label: 'Giorgione Akrilik 75ml', url: '/assets/products/shopee/giorgione_ac75.jpg' },
    { label: 'Joyko Art Brush BRS-18', url: '/assets/products/shopee/joyko_art_brush.jpg' },
    { label: 'Bantex SketchBook Spiral', url: '/assets/products/shopee/bantex_sketchbook.jpg' },
    { label: 'V-TEC Palet Oval Putih', url: '/assets/products/shopee/vtec_palet_oval.jpg' },
    { label: 'Faber-Castell Polychromos', url: '/assets/products/shopee/fc_polychromos.jpg' },
    { label: 'Isi Pensil Mekanik 2B', url: '/assets/products/shopee/lead_refill_2b.jpg' },
    { label: 'Pentel GraphGear 1000', url: '/assets/products/shopee/pentel_graphgear.jpg' },
    { label: 'Set 5 Spatula Lukis', url: '/assets/products/shopee/spatula_lukis_5set.jpg' },
    { label: 'Kuas Detail Line Art', url: '/assets/products/shopee/kuas_detail_line.jpg' },
    { label: 'Giorgione Cat Tube 12ml', url: '/assets/products/shopee/giorgione_tube_set.jpg' },
    { label: 'Drawing Gloves 2 Jari', url: '/assets/products/shopee/drawing_gloves.jpg' },
    { label: 'Touch Mark Alcohol Marker', url: '/assets/products/shopee/touchmark_marker.jpg' },
    { label: 'Pensil FC Castell 9000', url: '/assets/products/shopee/fc_castell_9000.jpg' },
  ];

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const filteredList = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search) ||
        p.brand.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === 'all' || p.categoryId === filterCategory;

      let matchStock = true;
      if (filterStockStatus === 'safe') matchStock = p.stock > p.minStock;
      else if (filterStockStatus === 'low') matchStock = p.stock <= p.minStock && p.stock > 0;
      else if (filterStockStatus === 'out') matchStock = p.stock <= 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, filterCategory, filterStockStatus]);

  const handleOpenAdd = () => {
    const nextCodeNum = products.length + 1;
    const nextCode = `SK-${String(nextCodeNum).padStart(3, '0')}`;
    const randBarcode = '899' + Math.floor(1000000000 + Math.random() * 9000000000);
    const randSku = 'HLA-' + Math.floor(1000 + Math.random() * 9000);

    setEditingProduct(null);
    setFormError(null);
    setPhotoSourceTab('upload');
    setFormData({
      code: nextCode,
      name: '',
      brand: 'Hilal.art',
      categoryId: categories[1]?.id || 'pensil-sketsa',
      series: '',
      type: 'Alat Seni',
      description: '',
      image: SAMPLE_IMAGES[0].url,
      unit: 'pcs',
      costPrice: 5000,
      sellPrice: 8000,
      stock: 50,
      minStock: 10,
      sku: randSku,
      barcode: randBarcode,
      isActive: true,
      variants: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormError(null);
    setPhotoSourceTab('upload');
    setFormData({ ...product, variants: product.variants ? [...product.variants] : [] });
    setIsModalOpen(true);
  };

  const handleToggleActive = (product: Product) => {
    const newStatus = !product.isActive;
    onUpdateProduct({ ...product, isActive: newStatus });
    showToast(
      `Produk "${product.name}" sekarang ${newStatus ? 'Aktif' : 'Nonaktif'} di kasir`,
      'info'
    );
  };

  // Open in-app delete modal
  const handleRequestDelete = (product: Product) => {
    setProductToDelete(product);
  };

  // Confirm delete product
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const deletedName = productToDelete.name;
    onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
    showToast(`Produk "${deletedName}" berhasil dihapus dari sistem`, 'success');
  };

  // Handle image file upload (Base64 data URL with automatic compression)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('File yang dipilih harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError('Ukuran gambar terlalu besar. Maksimal ukuran foto adalah 15 MB.');
      return;
    }

    setFormError(null);
    try {
      showToast('Mengoptimalkan foto...', 'info');
      const compressed = await compressImageFile(file, 800, 800, 0.82);
      setFormData((prev) => ({ ...prev, image: compressed }));
      showToast('Foto berhasil dimuat & dioptimalkan!', 'success');
    } catch (err) {
      console.warn('Gagal kompresi, fallback ke FileReader', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, image: reader.result as string }));
          showToast('Foto berhasil dimuat!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    const priceNum = parseInt(newVariantPrice, 10) || Number(formData.sellPrice) || 0;
    const stockNum = parseInt(newVariantStock, 10) || 0;
    const newVar: ProductVariant = {
      id: 'var-' + Date.now(),
      name: newVariantName.trim(),
      sku: `${formData.sku || 'HLA'}-${newVariantName.toUpperCase().replace(/\s+/g, '')}`,
      barcode: '899' + Math.floor(1000000000 + Math.random() * 9000000000),
      price: priceNum,
      costPrice: Number(formData.costPrice) || 0,
      stock: stockNum,
      minStock: 5,
      unit: formData.unit || 'pcs',
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }));
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantStock('');
  };

  const handleRemoveVariant = (varId: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((v) => v.id !== varId),
    }));
  };

  const handleGenerateSKU = () => {
    const brandCode = (formData.brand || 'HLA').substring(0, 3).toUpperCase();
    const nameCode = (formData.name || 'ART').substring(0, 3).toUpperCase();
    const random = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, sku: `HLA-${brandCode}-${nameCode}-${random}` }));
  };

  const handleGenerateBarcode = () => {
    const randomBarcode = '899' + Math.floor(1000000000 + Math.random() * 9000000000);
    setFormData((prev) => ({ ...prev, barcode: randomBarcode }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }

    if (!formData.image?.trim()) {
      setFormError('Silakan masukkan atau pilih foto untuk produk.');
      return;
    }

    const catObj = categories.find((c) => c.id === formData.categoryId);

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : 'prod-user-' + Date.now(),
      code: formData.code || 'SK-000',
      name: formData.name.trim(),
      brand: formData.brand?.trim() || 'Hilal.art',
      categoryId: formData.categoryId || 'pensil-sketsa',
      categoryName: catObj ? catObj.name : 'Lainnya',
      series: formData.series?.trim() || undefined,
      type: formData.type?.trim() || 'Peralatan Seni',
      description: formData.description?.trim() || '',
      image: formData.image || SAMPLE_IMAGES[0].url,
      unit: formData.unit || 'pcs',
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      sku: formData.sku || `HLA-${Date.now()}`,
      barcode: formData.barcode || '899' + Date.now(),
      isActive: formData.isActive ?? true,
      variants: formData.variants && formData.variants.length > 0 ? formData.variants : undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      ...({ isCustom: true } as any),
    };

    if (editingProduct) {
      onUpdateProduct(productPayload);
      showToast(`Produk "${productPayload.name}" berhasil diperbarui`, 'success');
    } else {
      onAddProduct(productPayload);
      showToast(`Produk "${productPayload.name}" berhasil ditambahkan ke katalog`, 'success');
    }
    setIsModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Kode', 'Nama Produk', 'Merek', 'Kategori', 'Satuan', 'Harga Modal', 'Harga Jual', 'Stok', 'Stok Min', 'SKU', 'Barcode', 'Status'];
    const rows = products.map((p) => [
      `"${p.code}"`,
      `"${p.name}"`,
      `"${p.brand}"`,
      `"${p.categoryName || p.categoryId}"`,
      `"${p.unit}"`,
      p.costPrice,
      p.sellPrice,
      p.stock,
      p.minStock,
      `"${p.sku}"`,
      `"${p.barcode}"`,
      p.isActive ? 'Aktif' : 'Nonaktif',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Katalog-Produk-HilalArt-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Katalog berhasil diekspor ke file CSV', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-4 sm:p-7 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white ${
              toastMessage.type === 'success'
                ? 'bg-[#0A261E] border border-[#E8C26E]/40'
                : toastMessage.type === 'error'
                ? 'bg-red-700 border border-red-500'
                : 'bg-slate-800 border border-slate-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#E8C26E]" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Manajemen Produk & Katalog
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A261E] text-[#E8C26E] font-bold">
              {products.length} Produk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola inventaris, foto produk, varian, SKU, harga jual, dan hapus produk toko Hilal.art
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white text-xs font-bold shadow-md shadow-[#0A261E]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#E8C26E]" />
            <span>+ Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, SKU, barcode, merek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#0A261E] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-[#0A261E]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as any)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-[#0A261E]"
          >
            <option value="all">Semua Status Stok</option>
            <option value="safe">Stok Aman</option>
            <option value="low">Stok Menipis</option>
            <option value="out">Stok Habis</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produk & Foto</th>
                <th className="py-3 px-3">Kode / SKU</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Harga Modal</th>
                <th className="py-3 px-3">Harga Jual</th>
                <th className="py-3 px-3">Stok</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada produk ditemukan</p>
                      <p className="text-[11px] text-slate-400">Silakan ubah pencarian atau tambahkan produk baru.</p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-[#0A261E] text-[#E8C26E] text-xs font-bold"
                      >
                        + Tambah Produk
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((product) => {
                  const isLow = product.stock <= product.minStock && product.stock > 0;
                  const isOut = product.stock <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES[0].url;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{product.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {product.brand} • 1 {product.unit}
                              {product.variants && (
                                <span className="text-[#0A261E] font-semibold ml-1">
                                  ({product.variants.length} varian)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-slate-800 block">{product.code}</span>
                        <span className="text-[10px] text-slate-400 block">{product.sku}</span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {product.categoryName || product.categoryId}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatCurrency(product.costPrice)}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-3 font-mono font-bold text-[#0A261E]">
                        {formatCurrency(product.sellPrice)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Min: {product.minStock}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {product.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions (Toggle, Edit, Delete) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleActive(product)}
                            title={product.isActive ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              product.isActive
                                ? 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'border-emerald-300 text-emerald-600 bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Produk & Foto"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRequestDelete(product)}
                            title="Hapus Produk"
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Delete Confirmation Modal (In-App Modal - 100% Reliable without window.confirm) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Produk Ini?</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini akan menghapus produk dari katalog toko.</p>
              </div>
            </div>

            {/* Product Card Preview */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={productToDelete.image}
                  alt={productToDelete.name}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs truncate">{productToDelete.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    SKU: {productToDelete.sku} • {productToDelete.brand}
                  </p>
                  <p className="text-xs font-bold text-[#0A261E] mt-1">
                    {formatCurrency(productToDelete.sellPrice)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Sisa Stok: {productToDelete.stock} {productToDelete.unit})
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Produk akan langsung terhapus dari etalase kasir Hilal.art. Riwayat transaksi lama yang pernah menggunakan produk ini tetap aman.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Produk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#0A261E] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-serif-luxury tracking-wide flex items-center gap-2">
                  <span>{editingProduct ? 'Ubah Data Produk & Foto' : 'Tambah Produk Baru'}</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8C26E] text-[#0A261E] font-extrabold">
                    Hilal.art
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {editingProduct ? `Kode: ${editingProduct.code}` : 'Tambahkan peralatan seni ke sistem kasir HilalPOS'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification inside modal */}
            {formError && (
              <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* SECTION: FOTO PRODUK (UPLOAD, PRESET, URL) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/40 via-white to-slate-50 border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#D8A229]" />
                      <span>Foto Produk</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Bisa unggah foto dari HP/Laptop, pilih dari galeri seni Hilal.art, atau masukkan link gambar.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab('upload')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                        photoSourceTab === 'upload'
                          ? 'bg-white text-[#0A261E] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Unggah File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab('preset')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                        photoSourceTab === 'preset'
                          ? 'bg-white text-[#0A261E] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-[#D8A229]" />
                      <span>Galeri Seni</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab('url')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                        photoSourceTab === 'url'
                          ? 'bg-white text-[#0A261E] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link URL</span>
                    </button>
                  </div>
                </div>

                {/* Photo Preview & Input Area */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Real-time Image Preview */}
                  <div className="w-24 h-24 rounded-xl border-2 border-[#0A261E]/20 bg-slate-100 overflow-hidden shrink-0 shadow-xs relative group">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES[0].url;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                        <span>Belum ada foto</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-0.5 text-center font-semibold">
                      Preview Foto
                    </div>
                  </div>

                  {/* Tab 1: Upload File from Device / Camera */}
                  {photoSourceTab === 'upload' && (
                    <div className="flex-1 w-full space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        id="product-image-file"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-image-file"
                        className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-[#0A261E]/30 bg-white hover:bg-emerald-50/50 hover:border-[#0A261E] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A261E] group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4 text-[#D8A229]" />
                          <span>Pilih Foto dari Galeri atau Kamera</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Format JPG, PNG, WEBP (Otomatis tersimpan & langsung tayang di kasir)
                        </p>
                      </label>
                      <p className="text-[10px] text-emerald-800 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Foto akan langsung diubah jadi format aman dan tersimpan di database lokal.
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Gallery Presets */}
                  {photoSourceTab === 'preset' && (
                    <div className="flex-1 w-full space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-600">
                        Klik gambar di bawah untuk memilih foto seni berkualitas tinggi:
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-28 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                        {SAMPLE_IMAGES.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, image: img.url });
                              showToast(`Foto "${img.label}" dipilih`, 'info');
                            }}
                            className={`group relative aspect-square rounded-lg border overflow-hidden transition-all ${
                              formData.image === img.url
                                ? 'ring-2 ring-[#0A261E] border-transparent scale-100'
                                : 'opacity-70 hover:opacity-100 border-slate-200'
                            }`}
                            title={img.label}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                            {formData.image === img.url && (
                              <div className="absolute inset-0 bg-[#0A261E]/40 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Link URL */}
                  {photoSourceTab === 'url' && (
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://... atau pilih dari galeri preset"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Tempel URL tautan gambar langsung dari internet jika foto di-hosting online.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: BASIC INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kode Produk (SKU Toko)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Produk Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pensil Graphite 2B Faber-Castell"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Merek / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Faber-Castell / Mont Marte / Phoenix"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {categories.filter((c) => c.id !== 'semua').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Satuan Penjualan
                  </label>
                  <input
                    type="text"
                    placeholder="pcs / set / tube / lbr / pack"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* SKU & Barcode Generator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">SKU Barang</label>
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="text-[10px] text-blue-600 hover:underline font-medium"
                    >
                      Buat Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Barcode / EAN-13</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-blue-600 hover:underline font-medium"
                    >
                      Buat Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-[#0A261E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deskripsi & Spesifikasi Produk
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan spesifikasi produk seni, ketebalan, daya rekat, atau cara pakai..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Product Variants Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Varian Produk (Ukuran, Warna, Seri)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {formData.variants?.length || 0} Varian Dibuat
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama Varian (misal: 4B, 75ml Biru, 40x60cm)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Harga (Rp)"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                    className="w-24 text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Stok"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                    className="w-18 text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-[#0A261E] text-white text-xs font-semibold rounded-lg hover:bg-[#133A2F]"
                  >
                    + Varian
                  </button>
                </div>

                {formData.variants && formData.variants.length > 0 && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {formData.variants.map((v) => (
                      <div key={v.id} className="p-2 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800">{v.name}</strong>
                          <span className="text-slate-500 ml-2">
                            {formatCurrency(v.price)} • Stok: {v.stock}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#0A261E] focus:ring-[#0A261E]"
                />
                <label htmlFor="isActive" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Tampilkan Produk Ini di Katalog Kasir (Status Aktif)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white text-xs font-bold shadow-md shadow-[#0A261E]/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#E8C26E]" />
                  <span>Simpan Produk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
