import React, { useState } from 'react';
import { 
  MapPin, 
  User, 
  ChevronDown, 
  Menu, 
  ShoppingCart,
  Wifi,
  WifiOff
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/receiptGenerator';

interface HeaderProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  lowStockCount: number;
  cartCount: number;
  cartTotal?: number;
  onToggleMobileMenu?: () => void;
  onSelectTab: (tab: any) => void;
  onToggleCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  cartCount,
  cartTotal = 0,
  onToggleMobileMenu,
  onSelectTab,
  onToggleCart,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleOnlineMode = () => {
    const nextStatus = !settings.isOnline;
    onUpdateSettings({
      ...settings,
      isOnline: nextStatus,
    });
  };

  const handleSelectCashier = (name: string) => {
    onUpdateSettings({
      ...settings,
      activeCashier: name,
    });
    setShowUserDropdown(false);
  };

  return (
    <header className="bg-[#FAF8F2] border-b border-[#ECE7DA] px-6 py-3.5 flex items-center justify-between shrink-0 select-none shadow-xs z-10 transition-colors">
      {/* Left: Easel Logo & Store Branding matching screenshot */}
      <div className="flex items-center gap-3.5">
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white border border-[#E0D8C3] hover:bg-slate-50 text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Easel Canvas Logo from attachment */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-xs flex items-center justify-center bg-transparent">
          <img
            src="/assets/products/easel_logo.png"
            alt="Hilal.art Easel Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Store Name, Subtitle, & Address */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D382B] tracking-tight font-serif-luxury leading-tight">
            {settings.storeName}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Art Supply & Creative Store
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-xs sm:max-w-md lg:max-w-lg">
              {settings.address}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Online Status, Cashier Account, Cart Badge & Mobile Hamburger */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Online / Offline Status Pill */}
        <button
          onClick={toggleOnlineMode}
          title={settings.isOnline ? 'Status Toko: Online (Klik untuk simulasikan offline)' : 'Status Toko: Offline'}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
            settings.isOnline
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] hover:bg-[#D7ECD8]'
              : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] hover:bg-[#FFE8CC]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              settings.isOnline ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#E65100]'
            }`}
          />
          <span>{settings.isOnline ? 'Online' : 'Offline'}</span>
        </button>

        {/* Cashier Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 text-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="font-bold text-xs text-slate-900 block">
                {settings.activeCashier}
              </span>
              <span className="text-[11px] text-slate-500">
                Kasir
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-900">Pilih Akun Kasir Aktif</p>
                <p className="text-slate-500 text-[11px]">Nama ini tercetak di struk transaksi</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => handleSelectCashier('Melina')}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between ${
                    settings.activeCashier === 'Melina'
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Melina</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                    Kasir Utama
                  </span>
                </button>

                <button
                  onClick={() => handleSelectCashier('Hilal')}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between ${
                    settings.activeCashier === 'Hilal'
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Hilal</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-normal">
                    Owner / Admin
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Shopping Cart Button with Cart Image & Counter as requested */}
        <button
          onClick={onToggleCart}
          title={`Buka Keranjang Belanja (${cartCount} item)`}
          className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-[#0A261E] hover:bg-[#133A2F] text-white shadow-md shadow-[#0A261E]/20 border border-[#D8A229]/50 transition-all duration-200 active:scale-95 group cursor-pointer"
        >
          {/* Cart Icon / Graphic with Notification Badge */}
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#D8A229]/20 flex items-center justify-center text-[#E8C26E] group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
            {cartCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#D32F2F] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border border-white animate-pulse">
                {cartCount}
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-500 rounded-full border border-white text-[8px] flex items-center justify-center font-bold text-white">
                0
              </span>
            )}
          </div>

          {/* Cart Label & Price Preview */}
          <div className="flex flex-col text-left leading-tight pr-0.5">
            <span className="text-[11px] font-bold text-slate-100 tracking-wide flex items-center gap-1">
              <span>Keranjang</span>
            </span>
            <span className="text-[10px] font-mono font-extrabold text-[#E8C26E]">
              {cartTotal && cartTotal > 0 ? formatCurrency(cartTotal) : `${cartCount} Item`}
            </span>
          </div>
        </button>

        {/* Mobile menu icon */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};
