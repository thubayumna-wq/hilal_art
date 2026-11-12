import { 
  ShoppingCart, 
  Package, 
  Layers, 
  ReceiptText, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  Store,
  Palette
} from 'lucide-react';
import { GoldMonogramH } from '../common/GoldMonogramH';

export type ActiveTab = 'dashboard' | 'pos' | 'products' | 'stock' | 'transactions' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, lowStockCount = 0 }) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard Toko', icon: Store },
    { id: 'pos' as ActiveTab, label: 'Kasir', icon: ShoppingCart },
    { id: 'products' as ActiveTab, label: 'Produk', icon: Package },
    { 
      id: 'stock' as ActiveTab, 
      label: 'Stok', 
      icon: Layers, 
      badge: lowStockCount > 0 ? lowStockCount : undefined 
    },
    { id: 'transactions' as ActiveTab, label: 'Transaksi', icon: ReceiptText },
    { id: 'reports' as ActiveTab, label: 'Laporan', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0A261E] text-white flex flex-col justify-between shrink-0 h-screen select-none border-r border-[#133A2F] z-20">
      {/* Top Branding Header */}
      <div>
        <div className="pt-6 pb-5 px-6 flex flex-col items-center text-center border-b border-[#133A2F]">
          <div className="mb-2 transition-transform hover:scale-105 duration-300">
            <GoldMonogramH size={58} className="drop-shadow-lg" />
          </div>
          <h1 className="text-xl font-bold tracking-wider font-serif-luxury text-[#E8C26E]">
            HILALPOS
          </h1>
          <p className="text-[10px] tracking-widest text-[#B59247] uppercase font-medium mt-0.5">
            SATU SISTEM, SEMUA USAHA
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#D8A229] text-[#0A261E] shadow-md shadow-amber-900/20 translate-x-1'
                    : 'text-slate-300 hover:text-white hover:bg-[#133A2F]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#0A261E]' : 'text-[#E8C26E]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-[#0A261E] text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Decorative Bottom Art Card with Side Jar from attachment */}
      <div className="relative overflow-hidden border-t border-[#133A2F] bg-gradient-to-t from-[#061812] to-[#0A261E]">
        <div className="w-full h-36 overflow-hidden flex items-center justify-center relative">
          <img
            src="/assets/products/side_jar.png"
            alt="Art Supplies Jar"
            className="w-full h-full object-cover object-center opacity-90 transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A261E] via-transparent to-transparent" />
        </div>
      </div>
    </aside>
  );
};
