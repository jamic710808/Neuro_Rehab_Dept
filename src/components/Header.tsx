import React from 'react';
import { Menu, Cloud, CloudUpload, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { SyncStatus } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  currentView: string;
  syncStatus: SyncStatus;
  onToggleSidebar: () => void;
}

export function Header({ currentView, syncStatus, onToggleSidebar }: HeaderProps) {
  const getTitle = () => {
    switch (currentView) {
      case 'entry-care': return '每日照護數填報';
      case 'entry-new': return '新接病人與病歷號碼明細';
      case 'dashboard': return '統計與績效總覽';
      default: return '';
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <div className="text-sm text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full flex items-center gap-2 transition-colors">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>雲端同步中...</span>
          </div>
        );
      case 'synced':
        return (
          <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2 transition-colors">
            <Cloud className="w-5 h-5" />
            <span>已連線至雲端</span>
          </div>
        );
      case 'mismatch':
        return (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-2 transition-colors">
            <AlertTriangle className="w-5 h-5" />
            <span>資料不符(暫停存檔)</span>
          </div>
        );
      default:
        return (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full flex items-center gap-2 transition-colors">
            <AlertCircle className="w-5 h-5" />
            <span>離線模式</span>
          </div>
        );
    }
  };

  return (
    <header className="bg-white shadow-sm z-20 h-16 flex items-center justify-between px-6 border-b border-slate-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-slate-500 hover:text-sky-600 transition-colors focus:outline-none bg-slate-100 hover:bg-slate-200 p-2 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{getTitle()}</h2>
      </div>
      <div className="flex items-center gap-4">
        {getSyncBadge()}
      </div>
    </header>
  );
}
