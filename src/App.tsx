import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CareEntry } from './components/CareEntry';
import { NewPatientEntry } from './components/NewPatientEntry';
import { Dashboard } from './components/Dashboard';
import { StaffData, ViewType, SyncStatus } from './types';
import { recalculateStaffTotals } from './lib/utils';
import { supabase } from './supabase';
import { CheckCircle, AlertTriangle, X, Plus, Trash } from 'lucide-react';

const getInitialMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('entry-care');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  const [selectedMonth, setSelectedMonth] = useState<string>(getInitialMonth);

  const [currentCmiNeuro, setCurrentCmiNeuro] = useState(1.2500);
  const [currentCmiRehab, setCurrentCmiRehab] = useState(1.1000);

  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'warning' }[]>([]);

  // Modals state
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [addBedData, setAddBedData] = useState<{ staffId: number; dayIndex: number } | null>(null);
  const [newBedNumber, setNewBedNumber] = useState('');

  const [isClearMonthModalOpen, setIsClearMonthModalOpen] = useState(false);

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [isManageStaffModalOpen, setIsManageStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');

  const [isDeleteStaffModalOpen, setIsDeleteStaffModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ id: number; name: string } | null>(null);

  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const loadDatabaseForMonth = useCallback(async (monthStr: string) => {
    setSyncStatus('syncing');

    try {
      const [year, month] = monthStr.split('-').map(Number);

      // 1. Fetch active staff
      const { data: staffData, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (staffErr) throw staffErr;
      const activeStaff = staffData || [];

      // 2. Fetch daily metrics
      const { data: metricsData, error: metricsErr } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('month_str', monthStr);

      if (metricsErr) throw metricsErr;

      const daysInMonth = new Date(year, month, 0).getDate();

      const newList = activeStaff.map(staff => {
        let records = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dayOfWeek = new Date(year, month - 1, d).getDay();
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

          const metric = metricsData?.find(m => m.staff_id === staff.id && m.record_date === dateStr);

          records.push({
            date: `${month.toString().padStart(2, "0")}/${d.toString().padStart(2, "0")}`,
            day: d,
            dayOfWeek,
            careCountNeuro: metric?.care_neuro || 0,
            careCountRehab: metric?.care_rehab || 0,
            newPatientsNeuro: metric?.new_neuro || 0,
            newPatientsRehab: metric?.new_rehab || 0,
            newPatientsOther: metric?.new_other || 0,
            newBeds: metric?.new_beds || []
          });
        }

        return {
          id: Number(staff.id),
          name: staff.name,
          records: records,
          ...recalculateStaffTotals(records, currentCmiNeuro, currentCmiRehab)
        };
      });

      setStaffList(newList);

      if (newList.length > 0 && (!selectedStaffId || !newList.find(s => s.id === selectedStaffId))) {
        setSelectedStaffId(newList[0].id);
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error("載入資料失敗:", error);
      setSyncStatus('error');
      showToast("載入資料失敗，請檢查網路或是資料庫設定", 'error');
    }
  }, [currentCmiNeuro, currentCmiRehab, selectedStaffId, showToast]);

  useEffect(() => {
    loadDatabaseForMonth(selectedMonth);
  }, [selectedMonth, loadDatabaseForMonth]);

  const rowTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedUpsertRow = (staffId: number, dayIndex: number, record: any) => {
    const key = `${staffId}-${dayIndex}`;
    if (rowTimeouts.current[key]) {
      clearTimeout(rowTimeouts.current[key]);
    }
    rowTimeouts.current[key] = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const day = dayIndex + 1;
        const record_date = `${selectedMonth}-${day.toString().padStart(2, '0')}`;

        const { error } = await supabase.from('daily_metrics').upsert({
          staff_id: staffId,
          record_date,
          month_str: selectedMonth,
          care_neuro: record.careCountNeuro,
          care_rehab: record.careCountRehab,
          new_neuro: record.newPatientsNeuro,
          new_rehab: record.newPatientsRehab,
          new_other: record.newPatientsOther,
          new_beds: record.newBeds
        }, { onConflict: 'staff_id, record_date' });

        if (error) throw error;
        setSyncStatus('synced');
      } catch (err) {
        console.error("更新資料庫指標失敗:", err);
        setSyncStatus('error');
      }
    }, 800);
  };

  const handleUpdateMetric = (staffId: number, dayIndex: number, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    let targetRecord: any = null;
    const updatedList = staffList.map(staff => {
      if (staff.id === staffId) {
        const newRecords = [...staff.records];
        newRecords[dayIndex] = { ...newRecords[dayIndex], [field]: numValue };
        targetRecord = newRecords[dayIndex];
        return { ...staff, records: newRecords, ...recalculateStaffTotals(newRecords, currentCmiNeuro, currentCmiRehab) };
      }
      return staff;
    });

    setStaffList(updatedList);

    // Check mismatch for new patients UI
    if (field === 'newPatientsNeuro' || field === 'newPatientsRehab' || field === 'newPatientsOther') {
      if (targetRecord) {
        const totalNew = targetRecord.newPatientsNeuro + targetRecord.newPatientsRehab + targetRecord.newPatientsOther;
        if (totalNew !== targetRecord.newBeds.length) setSyncStatus('mismatch');
        else setSyncStatus('synced');
      }
    }

    if (targetRecord) debouncedUpsertRow(staffId, dayIndex, targetRecord);
  };

  const handleAddBedPrompt = (staffId: number, dayIndex: number) => {
    setAddBedData({ staffId, dayIndex });
    setNewBedNumber('');
    setIsAddBedModalOpen(true);
  };

  const confirmAddBed = () => {
    if (!addBedData || !newBedNumber.trim()) return;

    let targetRecord: any = null;
    const updatedList = staffList.map(staff => {
      if (staff.id === addBedData.staffId) {
        const newRecords = [...staff.records];
        newRecords[addBedData.dayIndex] = {
          ...newRecords[addBedData.dayIndex],
          newBeds: [...newRecords[addBedData.dayIndex].newBeds, newBedNumber.trim()]
        };
        targetRecord = newRecords[addBedData.dayIndex];
        return { ...staff, records: newRecords };
      }
      return staff;
    });

    setStaffList(updatedList);
    if (targetRecord) debouncedUpsertRow(addBedData.staffId, addBedData.dayIndex, targetRecord);
    setIsAddBedModalOpen(false);
    showToast(`已新增病歷號 ${newBedNumber}`, 'success');
  };

  const handleRemoveBed = (staffId: number, dayIndex: number, bedIndex: number) => {
    let targetRecord: any = null;
    const updatedList = staffList.map(staff => {
      if (staff.id === staffId) {
        const newRecords = [...staff.records];
        const newBeds = [...newRecords[dayIndex].newBeds];
        newBeds.splice(bedIndex, 1);
        newRecords[dayIndex] = { ...newRecords[dayIndex], newBeds };
        targetRecord = newRecords[dayIndex];
        return { ...staff, records: newRecords };
      }
      return staff;
    });

    setStaffList(updatedList);
    if (targetRecord) debouncedUpsertRow(staffId, dayIndex, targetRecord);
    showToast("已移除病歷號", 'success');
  };

  const handleClearMonth = () => {
    setIsClearMonthModalOpen(true);
  };

  const confirmClearMonth = async () => {
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('daily_metrics')
        .delete()
        .eq('staff_id', selectedStaffId)
        .eq('month_str', selectedMonth);

      if (error) throw error;

      const updatedList = staffList.map(staff => {
        if (staff.id === selectedStaffId) {
          const newRecords = staff.records.map(r => ({
            ...r,
            careCountNeuro: 0,
            careCountRehab: 0,
            newPatientsNeuro: 0,
            newPatientsRehab: 0,
            newPatientsOther: 0,
            newBeds: []
          }));
          return {
            ...staff,
            records: newRecords,
            ...recalculateStaffTotals(newRecords, currentCmiNeuro, currentCmiRehab)
          };
        }
        return staff;
      });

      setStaffList(updatedList);
      setIsClearMonthModalOpen(false);
      setSyncStatus('synced');
      showToast("已清空該員本月資料", 'success');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      showToast("清空失敗", 'error');
    }
  };

  const handleCmiChange = (neuro: number, rehab: number) => {
    setCurrentCmiNeuro(neuro);
    setCurrentCmiRehab(rehab);
    const recalculated = staffList.map(staff => ({
      ...staff,
      ...recalculateStaffTotals(staff.records, neuro, rehab)
    }));
    setStaffList(recalculated);
    showToast("已更新 CMI 並重新計算", 'success');
  };

  const handleExportCSV = () => {
    const sorted = [...staffList].sort((a, b) => b.totalScore - a.totalScore);
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "排名,人員姓名,工作天,照護總數,照護日均得分,新接日均得分,綜合評分,換算基數\n";

    sorted.forEach((s, idx) => {
      csvContent += `${idx + 1},${s.name},${s.workdays},${s.totalCare},${s.careScore},${s.newScore},${s.totalScore.toFixed(2)},${s.baseValue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `神復組績效排名_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("已匯出 Excel", 'success');
  };

  const requireAdminAuth = (action: () => void) => {
    if (isAdminAuthenticated) {
      action();
    } else {
      setPendingAdminAction(() => action);
      setAdminPassword('');
      setIsAdminAuthModalOpen(true);
    }
  };

  const confirmAdminAuth = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setIsAdminAuthModalOpen(false);
      if (pendingAdminAction) {
        pendingAdminAction();
        setPendingAdminAction(null);
      }
      showToast("管理員驗證成功", 'success');
    } else {
      showToast("密碼錯誤", 'error');
    }
  };

  const handleManageStaff = () => {
    requireAdminAuth(() => {
      setIsManageStaffModalOpen(true);
    });
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim()) return;

    setSyncStatus('syncing');
    try {
      // 在 Supabase 中 id 是 BIGINT 且自動遞增，我們不需要手動算 ID
      const { data, error } = await supabase
        .from('staff')
        .insert({ name: newStaffName.trim(), is_active: true })
        .select();

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        showToast(`已新增人員 ${data[0].name}`, 'success');
        setNewStaffName('');
        // 重新讀取當月資料以更新 UI
        await loadDatabaseForMonth(selectedMonth);
      }
    } catch (err: any) {
      console.error("Add Staff Failed:", err);
      setSyncStatus('error');
      showToast(`新增失敗: ${err.message || '未知錯誤'}`, 'error');
    }
  };

  const handleDeleteStaffPrompt = (staff: { id: number; name: string }) => {
    setStaffToDelete(staff);
    setIsDeleteStaffModalOpen(true);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;

    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('staff').update({ is_active: false }).eq('id', staffToDelete.id);
      if (error) throw error;

      setIsDeleteStaffModalOpen(false);
      setStaffToDelete(null);
      showToast(`已刪除人員`, 'success');
      loadDatabaseForMonth(selectedMonth);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      showToast("刪除員工失敗", 'error');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar
        isExpanded={isSidebarExpanded}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'dashboard') {
            requireAdminAuth(() => setCurrentView(view));
          } else {
            setCurrentView(view);
          }
        }}
        onManageStaff={handleManageStaff}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header
          currentView={currentView}
          syncStatus={syncStatus}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        {currentView === 'entry-care' && (
          <CareEntry
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            selectedMonth={selectedMonth}
            onStaffChange={setSelectedStaffId}
            onMonthChange={setSelectedMonth}
            onClearMonth={handleClearMonth}
            onSaveToCloud={() => showToast("現在系統會在每次輸入時自動且即時存檔！無需再手動點儲存。", "success")}
            onUpdateMetric={handleUpdateMetric}
          />
        )}

        {currentView === 'entry-new' && (
          <NewPatientEntry
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            selectedMonth={selectedMonth}
            onStaffChange={setSelectedStaffId}
            onMonthChange={setSelectedMonth}
            onClearMonth={handleClearMonth}
            onSaveToCloud={() => showToast("現在系統會在每次輸入時自動且即時存檔！無需再手動點儲存。", "success")}
            onUpdateMetric={handleUpdateMetric}
            onAddBedPrompt={handleAddBedPrompt}
            onRemoveBed={handleRemoveBed}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            staffList={staffList}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            currentCmiNeuro={currentCmiNeuro}
            currentCmiRehab={currentCmiRehab}
            onCmiChange={handleCmiChange}
            onExportCSV={handleExportCSV}
          />
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-600' :
            toast.type === 'error' ? 'bg-red-600' : 'bg-amber-500'
            }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <X className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Modals */}
      {isAddBedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">新增病歷號碼</h3>
              <button onClick={() => setIsAddBedModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">輸入病人病歷號碼 (例如: 1234567)</label>
              <input
                type="text"
                value={newBedNumber}
                onChange={(e) => setNewBedNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmAddBed()}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none"
                placeholder="輸入病歷號..."
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsAddBedModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={confirmAddBed} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">確定新增</button>
            </div>
          </div>
        </div>
      )}

      {isClearMonthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">確定要清空資料嗎？</h3>
              <p className="text-sm text-slate-500">這將會清除 <span className="font-bold text-slate-700">{staffList.find(s => s.id === selectedStaffId)?.name}</span> 在 {selectedMonth} 的所有寫入紀錄，且無法復原。</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-3">
              <button onClick={() => setIsClearMonthModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={confirmClearMonth} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">確定清空</button>
            </div>
          </div>
        </div>
      )}

      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">管理員權限驗證</h3>
              <button onClick={() => setIsAdminAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">請輸入管理員密碼以存取此功能 (預設: admin123)</p>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmAdminAuth()}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 outline-none"
                placeholder="輸入密碼..."
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsAdminAuthModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={confirmAdminAuth} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700">驗證</button>
            </div>
          </div>
        </div>
      )}

      {isManageStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">名單管理設定</h3>
              <button onClick={() => setIsManageStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-white">
              <label className="block text-sm font-medium text-slate-700 mb-2">新增人員</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
                  className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 outline-none"
                  placeholder="輸入姓名..."
                />
                <button onClick={handleAddStaff} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> 新增
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">現有編制人員 ({staffList.length})</h4>
              <ul className="space-y-2">
                {staffList.map(staff => (
                  <li
                    key={staff.id}
                    className={`p-3 rounded-lg flex justify-between items-center shadow-sm border transition-all ${staff.id === selectedStaffId
                      ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    onClick={() => setSelectedStaffId(staff.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${staff.id === selectedStaffId ? 'text-sky-800' : 'text-slate-700'}`}>{staff.name}</span>
                      {staff.id === selectedStaffId && (
                        <span className="text-[10px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">目前選擇</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStaffPrompt(staff);
                      }}
                      className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      title="刪除人員"
                    >
                      <Trash className="w-4 h-4" />
                      <span className="text-xs font-medium">刪除</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsManageStaffModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">關閉</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteStaffModalOpen && staffToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">確定要刪除人員嗎？</h3>
              <p className="text-sm text-slate-500">刪除後 <span className="font-bold text-slate-700">{staffToDelete.name}</span> 將不會在此月出現。資料已作軟刪除。</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-3">
              <button onClick={() => setIsDeleteStaffModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={confirmDeleteStaff} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">確定刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
