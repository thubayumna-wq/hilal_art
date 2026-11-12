import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  Printer, 
  Percent, 
  Database, 
  Check, 
  Download, 
  Upload, 
  RotateCcw,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { exportDatabaseJSON, importDatabaseJSON, resetDatabaseToDefault } from '../../utils/storage';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup-HILALPOS-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportStatus('Cadangan berhasil dipulihkan! Halaman akan memuat data terbaru.');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus('Gagal memulihkan file cadangan. Format JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke katalog demo awal Hilal.art?')) {
      resetDatabaseToDefault();
      onResetData();
      alert('Database berhasil direset ke data awal Hilal.art');
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto select-none p-5 sm:p-7 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Pengaturan Toko & Aplikasi
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A261E] text-[#E8C26E] font-bold">
              HILALPOS v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan identitas toko seni Hilal.art, printer thermal, pajak PPN, akun pengguna, dan backup
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Toko & Kasir */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-[#0A261E]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Identitas Toko & Akun Kasir
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Toko (Tampil di Kasir & Struk)
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-1 focus:ring-[#0A261E]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tagline Aplikasi
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-1 focus:ring-[#0A261E]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Alamat Lengkap Toko
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-1 focus:ring-[#0A261E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Owner / Admin
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kasir Utama Aktif
              </label>
              <input
                type="text"
                value={formData.activeCashier}
                onChange={(e) => setFormData({ ...formData, activeCashier: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Format Struk Thermal 58mm / 80mm */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-[#0A261E]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Konfigurasi Printer & Struk Thermal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Ukuran Lebar Kertas Default
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['58mm', '80mm'] as const).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => setFormData({ ...formData, receiptPaperWidth: width })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono transition-all ${
                      formData.receiptPaperWidth === width
                        ? 'border-[#0A261E] bg-[#0A261E] text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Kertas {width}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showReceiptLogo}
                  onChange={(e) => setFormData({ ...formData, showReceiptLogo: e.target.checked })}
                  className="rounded text-[#0A261E] focus:ring-[#0A261E]"
                />
                <span>Cetak Logo Monogram HILALPOS pada Struk</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pesan Penutup Struk (Footer Message)
            </label>
            <textarea
              rows={3}
              value={formData.footerReceiptMsg}
              onChange={(e) => setFormData({ ...formData, footerReceiptMsg: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
            />
          </div>
        </div>

        {/* Section 3: Pajak & Finansial */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-[#0A261E]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Pengaturan Pajak Pertambahan Nilai (PPN)
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Terapkan PPN pada Kasir
              </span>
              <span className="text-[11px] text-slate-500">
                Pajak otomatis ditambahkan pada subtotal keranjang belanja
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.taxEnabled}
              onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-[#0A261E] focus:ring-[#0A261E]"
            />
          </div>

          {formData.taxEnabled && (
            <div className="w-48">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Persentase PPN (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxPercentage}
                  onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  %
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0A261E] hover:bg-[#133A2F] text-white font-bold text-xs shadow-md shadow-[#0A261E]/20 flex items-center gap-2 transition-transform active:scale-98"
          >
            <Check className="w-4 h-4 text-[#E8C26E]" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Section 4: Cadangan & Pemulihan Database */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-slate-900 text-sm">
            Cadangan & Pemulihan Database (Backup & Restore)
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Unduh seluruh data produk, varian, riwayat transaksi, dan inventaris toko ke dalam berkas JSON untuk diamankan, atau pulihkan kapan saja.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Database (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Pulihkan dari File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Demo Hilal.art</span>
          </button>
        </div>
      </div>
    </div>
  );
};
