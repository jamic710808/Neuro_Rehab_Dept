import React from 'react';
import { Trash, CloudUpload } from 'lucide-react';
import { StaffData } from '../types';

interface CareEntryProps {
  staffList: StaffData[];
  selectedStaffId: number;
  selectedMonth: string;
  onStaffChange: (id: number) => void;
  onMonthChange: (month: string) => void;
  onClearMonth: () => void;
  onSaveToCloud: () => void;
  onUpdateMetric: (staffId: number, dayIndex: number, field: string, value: string) => void;
}

export function CareEntry({
  staffList,
  selectedStaffId,
  selectedMonth,
  onStaffChange,
  onMonthChange,
  onClearMonth,
  onSaveToCloud,
  onUpdateMetric
}: CareEntryProps) {
  const selectedStaff = staffList.find(s => s.id === selectedStaffId);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const generateMonthOptions = () => {
    const options = [];
    for (let y = 2026; y <= 2027; y++) {
      const group = [];
      for (let m = 1; m <= 12; m++) {
        const value = `${y}-${m}`;
        const label = `${y}年 ${m.toString().padStart(2, '0')}月`;
        group.push(<option key={value} value={value}>{label}</option>);
      }
      options.push(<optgroup key={y} label={`${y}年度`}>{group}</optgroup>);
    }
    return options;
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto animate-fade-in-down">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">每日照護數登錄</h3>
            <p className="text-sm text-slate-500">輸入變更會即時同步至雲端資料庫。</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedStaffId}
              onChange={(e) => onStaffChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
            >
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
            >
              {generateMonthOptions()}
            </select>
            <button
              onClick={onClearMonth}
              className="bg-white border border-red-300 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <Trash className="w-4 h-4" /> 清空此員本月
            </button>
            <button
              onClick={onSaveToCloud}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2"
            >
              <CloudUpload className="w-4 h-4" /> 強制儲存
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 w-32">日期</th>
                <th scope="col" className="px-4 py-4 w-40 text-center text-indigo-700 bg-indigo-50/50">神經科 (手動)</th>
                <th scope="col" className="px-4 py-4 w-40 text-center text-teal-700 bg-teal-50/50">復健科 (手動)</th>
                <th scope="col" className="px-6 py-4 text-center font-bold">當日總照護數</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedStaff?.records.map((record, index) => {
                const total = (Number(record.careCountNeuro) || 0) + (Number(record.careCountRehab) || 0);
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3 font-medium text-slate-900 border-r border-slate-100 bg-white group-hover:bg-slate-50">
                      {record.date} <span className="text-xs text-slate-400 ml-1">周{weekDays[record.dayOfWeek]}</span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 bg-indigo-50/20">
                      <input
                        type="number"
                        min="0"
                        value={(record.careCountNeuro || 0) === 0 ? '' : record.careCountNeuro}
                        onChange={(e) => onUpdateMetric(selectedStaff.id, index, 'careCountNeuro', e.target.value)}
                        className="w-24 text-center bg-white border border-slate-300 text-slate-900 text-sm rounded focus:ring-indigo-500 mx-auto block p-1.5"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 bg-teal-50/20">
                      <input
                        type="number"
                        min="0"
                        value={(record.careCountRehab || 0) === 0 ? '' : record.careCountRehab}
                        onChange={(e) => onUpdateMetric(selectedStaff.id, index, 'careCountRehab', e.target.value)}
                        className="w-24 text-center bg-white border border-slate-300 text-slate-900 text-sm rounded focus:ring-teal-500 mx-auto block p-1.5"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-bold text-slate-700 text-lg">{total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
