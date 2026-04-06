import React from 'react';
import { Network, ArrowRight } from 'lucide-react';
import { GROUPS, GroupConfig } from '../config/groups';

interface GroupSelectorProps {
    onSelectGroup: (group: GroupConfig) => void;
}

export function GroupSelector({ onSelectGroup }: GroupSelectorProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10 animate-fade-in-down">
                    <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-sky-200">
                        <Network className="w-10 h-10 text-sky-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">各組別成效管理系統</h1>
                    <p className="text-slate-500 text-lg">請選擇您要管理與填報的組別</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
                    {GROUPS.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => onSelectGroup(group)}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-300 transition-all duration-300 text-left flex flex-col justify-between h-full hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-50 to-transparent -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-sky-100 flex items-center justify-center text-slate-600 group-hover:text-sky-600 font-bold transition-colors">
                                        {group.id}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-sky-700 transition-colors">{group.name}</h3>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">涵蓋科別 ({group.departments.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.departments.map(dept => (
                                            <span key={dept.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                {dept.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center text-sm font-medium text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                                進入填報 <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
