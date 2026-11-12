import React from 'react';
import { RefreshCw, Printer, Info, CheckCircle2, WifiOff } from 'lucide-react';
import { StoreSettings } from '../../types';

interface FooterBarProps {
  settings: StoreSettings;
  onManualSync?: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({ settings, onManualSync }) => {
  return (
    <footer className="h-9 bg-[#07241C] text-slate-300 border-t border-[#123F32] px-5 flex items-center justify-between text-[11px] select-none shrink-0 font-mono z-10">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Sinkronisasi status */}
        <div className="flex items-center gap-1.5">
          {settings.isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span className="font-sans font-medium text-slate-200">
                Sinkronisasi: <strong className="text-emerald-400">Terhubung</strong>
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="font-sans font-medium text-amber-300">
                Sinkronisasi: Mode Offline (Tersimpan Lokal)
              </span>
            </>
          )}
        </div>

        <span className="text-[#194D3E] hidden sm:inline">|</span>

        {/* Terakhir Sinkron */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-300">
          <RefreshCw className="w-3 h-3 text-[#D8A229]" />
          <span>Terakhir Sinkron: {settings.lastSyncedAt || 'Hari ini'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Printer Status */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Printer: <strong className="text-white">Siap ({settings.receiptPaperWidth})</strong></span>
        </div>

        <span className="text-[#194D3E] hidden sm:inline">|</span>

        {/* Version */}
        <div className="flex items-center gap-1 text-slate-400">
          <Info className="w-3 h-3 text-[#D8A229]" />
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};
