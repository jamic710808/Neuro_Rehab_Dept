import React from 'react';
import { Brain, Stethoscope, UserPlus, ChartLine, Users } from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  isExpanded: boolean;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onManageStaff: () => void;
}

export function Sidebar({ isExpanded, currentView, onNavigate, onManageStaff }: SidebarProps) {
  const navItems = [
    { id: 'entry-care' as ViewType, icon: Stethoscope, label: '照護數填報' },
    { id: 'entry-new' as ViewType, icon: UserPlus, label: '新接數與病歷號碼' },
  ];

  return (
    <aside
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm flex-shrink-0 transition-all duration-300 overflow-hidden",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className="h-16 flex items-center border-b border-slate-100 bg-slate-800 text-white min-w-[16rem]">
        <div className="w-20 flex justify-center items-center flex-shrink-0">
          <Brain className="w-8 h-8 text-sky-400" />
        </div>
        <span
          className={cn(
            "font-bold tracking-wide whitespace-nowrap transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          1.神復組
        </span>
      </div>

      <nav className="flex-1 mt-6 flex flex-col gap-2 min-w-[16rem]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex items-center py-3 transition-colors text-left w-full",
              currentView === item.id
                ? "bg-e0f2fe text-sky-600 border-l-4 border-sky-600 font-semibold bg-sky-50"
                : "text-slate-500 border-l-4 border-transparent hover:bg-slate-50"
            )}
          >
            <div className="w-20 flex justify-center items-center flex-shrink-0">
              <item.icon className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "whitespace-nowrap transition-opacity duration-200",
                isExpanded ? "opacity-100" : "opacity-0"
              )}
            >
              {item.label}
            </span>
          </button>
        ))}

        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            "flex items-center py-3 transition-colors text-left w-full border-t border-slate-100 mt-2 pt-4",
            currentView === 'dashboard'
              ? "bg-e0f2fe text-sky-600 border-l-4 border-sky-600 font-semibold bg-sky-50"
              : "text-slate-500 border-l-4 border-transparent hover:bg-slate-50"
          )}
        >
          <div className="w-20 flex justify-center items-center flex-shrink-0">
            <ChartLine className="w-5 h-5" />
          </div>
          <span
            className={cn(
              "whitespace-nowrap transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            統計總覽
          </span>
        </button>

        <button
          onClick={onManageStaff}
          className="text-slate-500 border-l-4 border-transparent hover:bg-slate-50 flex items-center py-3 transition-colors text-left w-full"
        >
          <div className="w-20 flex justify-center items-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <span
            className={cn(
              "whitespace-nowrap transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            人員名單管理
          </span>
        </button>
      </nav>

      <div className="py-4 border-t border-slate-100 flex items-center min-w-[16rem]">
        <div className="w-20 flex justify-center items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow">
            管
          </div>
        </div>
        <div
          className={cn(
            "whitespace-nowrap transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-sm font-bold text-slate-700">系統管理員</p>
          <p className="text-xs text-slate-400">Neuro & Rehab Dept.</p>
        </div>
      </div>
    </aside>
  );
}
