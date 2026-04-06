import React from 'react';
import { Trash, CloudUpload, Plus, X, AlertTriangle } from 'lucide-react';
import { StaffData } from '../types';
import { cn } from '../lib/utils';

interface NewPatientEntryProps {
  staffList: StaffData[];
  selectedStaffId: number;
  selectedMonth: string;
  onStaffChange: (id: number) => void;
  onMonthChange: (month: string) => void;
  onClearMonth: () => void;
  onSaveToCloud: () => void;
  onUpdateMetric: (staffId: number, dayIndex: number, field: string, value: string) => void;
  onAddBedPrompt: (staffId: number, dayIndex: number) => void;
  onRemoveBed: (staffId: number, dayIndex: number, bedIndex: number) => void;
}

export function NewPatientEntry({
  staffList,
  selectedStaffId,
  selectedMonth,
  onStaffChange,
  onMonthChange,
  onClearMonth,
  onSaveToCloud,
  onUpdateMetric,
  onAddBedPrompt,
  onRemoveBed
}: NewPatientEntryProps) {
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
            <h3 className="text-lg font-bold text-slate-800">新接病人數與病歷號碼明細登錄</h3>
            <p className="text-sm text-slate-500">手動輸入科別新接數。輸入變更與病歷號碼異動將即時同步至雲端。</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedStaffId}
              onChange={(e) => onStaffChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
            >
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2"
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
                <th scope="col" className="px-4 py-4 w-24 text-center text-indigo-700 bg-indigo-50/50">神經科</th>
                <th scope="col" className="px-4 py-4 w-24 text-center text-teal-700 bg-teal-50/50">復健科</th>
                <th scope="col" className="px-4 py-4 w-24 text-center text-slate-700 bg-slate-50/50">其他</th>
                <th scope="col" className="px-4 py-4 w-28 text-center font-bold">當日總新接</th>
                <th scope="col" className="px-6 py-4">病歷號碼明細 (可增刪)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedStaff?.records.map((record, index) => {
                const total = (Number(record.newPatientsNeuro) || 0) + (Number(record.newPatientsRehab) || 0) + (Number(record.newPatientsOther) || 0);
                const isMismatch = total !== record.newBeds.length;

                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3 font-medium text-slate-900 border-r border-slate-100 bg-white group-hover:bg-slate-50">
                      {record.date} <span className="text-xs text-slate-400 ml-1">周{weekDays[record.dayOfWeek]}</span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 bg-indigo-50/20">
                      <input
                        type="number"
                        min="0"
                        value={(record.newPatientsNeuro || 0) === 0 ? '' : record.newPatientsNeuro}
                        onChange={(e) => onUpdateMetric(selectedStaff.id, index, 'newPatientsNeuro', e.target.value)}
                        className="w-16 text-center bg-white border border-slate-300 rounded focus:ring-indigo-500 mx-auto block p-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 bg-teal-50/20">
                      <input
                        type="number"
                        min="0"
                        value={(record.newPatientsRehab || 0) === 0 ? '' : record.newPatientsRehab}
                        onChange={(e) => onUpdateMetric(selectedStaff.id, index, 'newPatientsRehab', e.target.value)}
                        className="w-16 text-center bg-white border border-slate-300 rounded focus:ring-teal-500 mx-auto block p-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 bg-slate-50/20">
                      <input
                        type="number"
                        min="0"
                        value={(record.newPatientsOther || 0) === 0 ? '' : record.newPatientsOther}
                        onChange={(e) => onUpdateMetric(selectedStaff.id, index, 'newPatientsOther', e.target.value)}
                        className="w-16 text-center bg-white border border-slate-300 rounded focus:ring-slate-500 mx-auto block p-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-100">
                      <span className={cn("font-bold text-lg", total > 0 ? "text-emerald-600" : "text-slate-300")}>
                        {total}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap items-center gap-y-1">
                        {record.newBeds.map((bed, bedIdx) => (
                          <span key={bedIdx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded border border-slate-200 mr-2 mb-1">
                            {bed}
                            <button
                              onClick={() => onRemoveBed(selectedStaff.id, index, bedIdx)}
                              className="text-slate-400 hover:text-red-500 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => onAddBedPrompt(selectedStaff.id, index)}
                          className="text-xs text-slate-500 hover:text-emerald-600 border border-dashed border-slate-300 rounded px-2 py-1 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> 新增病歷號
                        </button>
                        {isMismatch && total > 0 && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
                        )}
                      </div>
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
