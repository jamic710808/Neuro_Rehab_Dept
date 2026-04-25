import React, { useState } from 'react';
import {
  LayoutGrid, Settings2, Calendar, Download,
  Users, UserPlus, ChartLine, Trophy, TrendingUp, PieChart,
  ClipboardList, Pointer, Bed, CheckCircle, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import { StaffData, DashViewMode } from '../types';
import { GroupConfig } from '../config/groups';
import { cn } from '../lib/utils';

interface DashboardProps {
  activeGroup: GroupConfig;
  staffList: StaffData[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  cmiConfig: Record<string, number>;
  onCmiChange: (deptId: string, value: number) => void;
  onExportCSV: () => void;
}

export function Dashboard({
  activeGroup,
  staffList,
  selectedMonth,
  onMonthChange,
  cmiConfig,
  onCmiChange,
  onExportCSV
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<DashViewMode>('overview');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // 為每一個科別準備 local state 避免一直觸發 onCmiChange
  const [localCmiInputs, setLocalCmiInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activeGroup.departments.forEach(d => {
      init[d.id] = (cmiConfig[d.id] || 1.0).toFixed(4);
    });
    return init;
  });

  const handleCmiBlur = (deptId: string) => {
    const val = parseFloat(localCmiInputs[deptId]) || 1.0;
    setLocalCmiInputs(prev => ({ ...prev, [deptId]: val.toFixed(4) }));
    onCmiChange(deptId, val);
  };

  const handleCmiKeyDown = (e: React.KeyboardEvent, deptId: string) => {
    if (e.key === 'Enter') handleCmiBlur(deptId);
  };

  const sortedStaffList = [...staffList].sort((a, b) => b.totalScore - a.totalScore);
  const filteredStaffList = sortedStaffList.filter(s => s.name.includes(searchQuery));
  const selectedStaff = viewMode === 'staff' ? staffList.find(s => s.id === selectedStaffId) : null;

  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const endYear = Math.max(2028, currentYear + 1);
    for (let y = 2026; y <= endYear; y++) {
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

  const COLORS = ['#4f46e5', '#0d9488', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

  const renderOverview = () => {
    const totalCare = staffList.reduce((sum, s) => sum + s.totalCare, 0);
    const totalNew = staffList.reduce((sum, s) => sum + s.totalNew, 0);
    const avgWorkdays = (staffList.reduce((sum, s) => sum + s.workdays, 0) / (staffList.length || 1)).toFixed(1);
    const avgScore = (staffList.reduce((sum, s) => sum + s.totalScore, 0) / (staffList.length || 1)).toFixed(2);

    const barData = sortedStaffList.map(s => ({
      name: s.name,
      '綜合評分': s.totalScore,
      '換算基數': s.baseValue
    }));

    // Overview pie chart by department
    let aggregatedDeptCare: Record<string, number> = {};
    activeGroup.departments.forEach(d => aggregatedDeptCare[d.id] = 0);
    staffList.forEach(s => {
      Object.keys(s.totalCareByDept || {}).forEach(k => {
        aggregatedDeptCare[k] = (aggregatedDeptCare[k] || 0) + s.totalCareByDept[k];
      });
    });

    const pieData = activeGroup.departments.map(d => ({
      name: d.name,
      value: aggregatedDeptCare[d.id] || 0
    })).filter(p => p.value > 0);

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">總照護數</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalCare}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">總新接病人</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalNew}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <ChartLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">平均工作天</p>
              <h3 className="text-2xl font-bold text-slate-800">{avgWorkdays}</h3>
            </div>
          </div>
          <div className="bg-sky-600 rounded-xl p-5 shadow-md flex items-center gap-4 text-white ring-2 ring-sky-200 ring-offset-2">
            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs text-sky-100 font-bold uppercase">日均綜合評分</p>
              <h3 className="text-2xl font-bold text-white">{avgScore}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-500" /> 人員評分趨勢 {activeGroup.name}</h3>
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="綜合評分" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="換算基數" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-500" /> 各科別照護占比</h3>
            <div className="h-[280px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex bg-slate-50 items-center justify-center h-full text-slate-400 text-sm">尚無科別照護資料</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pb-10">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">人員數據匯總</h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-600 relative min-w-max">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-[0_1px_0_0_#f1f5f9] z-10">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">排名</th>
                    <th className="px-4 py-3">人員姓名</th>
                    <th className="px-4 py-3 text-center">工作天</th>
                    <th className="px-4 py-3 text-center">照護總數</th>
                    <th className="px-4 py-3 text-center">照護日均得分</th>
                    <th className="px-4 py-3 text-center">新接日均得分</th>
                    <th className="px-4 py-3 text-right text-sky-700 font-bold">綜合評分</th>
                    <th className="px-4 py-3 text-center text-purple-700 font-bold">換算基數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStaffList.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      onClick={() => { setViewMode('staff'); setSelectedStaffId(staff.id); setSelectedDayIndex(null); }}
                      className="hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{staff.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-500">{staff.workdays}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{staff.totalCare}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{staff.careScore}</td>
                      <td className="px-4 py-3 text-center text-emerald-600">{staff.newScore}</td>
                      <td className="px-4 py-3 text-right text-sky-600 font-bold">{staff.totalScore.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-purple-600 font-bold text-lg bg-purple-50/50">{staff.baseValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderStaffDetail = () => {
    if (!selectedStaff) return null;

    const lineData = selectedStaff.records.map(r => {
      let careSum = 0;
      activeGroup.departments.forEach(d => careSum += (r.careCounts?.[d.id] || 0));
      let newSum = r.newPatientsOther || 0;
      activeGroup.departments.forEach(d => newSum += (r.newPatients?.[d.id] || 0));
      return {
        day: r.day,
        '每日合併照護': careSum,
        '每日合併新接': newSum
      };
    });

    const pieData = activeGroup.departments.map(d => ({
      name: d.name + '照護',
      value: selectedStaff.totalCareByDept?.[d.id] || 0
    })).filter(p => p.value > 0);

    const selectedRecord = selectedDayIndex !== null ? selectedStaff.records[selectedDayIndex] : null;
    let sumNewSelected = 0;
    if (selectedRecord) {
      sumNewSelected += (selectedRecord.newPatientsOther || 0);
      activeGroup.departments.forEach(d => sumNewSelected += (selectedRecord.newPatients?.[d.id] || 0));
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">總照護數</p>
              <h3 className="text-2xl font-bold text-slate-800">{selectedStaff.totalCare}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">總新接病人</p>
              <h3 className="text-2xl font-bold text-slate-800">{selectedStaff.totalNew}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <ChartLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">平均工作天</p>
              <h3 className="text-2xl font-bold text-slate-800">{selectedStaff.workdays} 天</h3>
            </div>
          </div>
          <div className="bg-sky-600 rounded-xl p-5 shadow-md flex items-center gap-4 text-white ring-2 ring-sky-200 ring-offset-2">
            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs text-sky-100 font-bold uppercase">日均綜合評分</p>
              <h3 className="text-2xl font-bold text-white">{selectedStaff.totalScore.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-500" /> 趨勢分析</h3>
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Legend iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="每日合併照護" stroke="#0ea5e9" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="每日合併新接" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-500" /> 本月結構分布</h3>
            <div className="h-[280px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex bg-slate-50 items-center justify-center h-full text-slate-400 text-sm">無資料</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">人員數據匯總 ({activeGroup.name})</h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-600 relative min-w-max">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-[0_1px_0_0_#f1f5f9] z-10">
                  <tr>
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 border-r border-slate-200">日期</th>
                    {activeGroup.departments.map(d => (
                      <th key={d.id} className="px-4 py-3 text-center border-r border-slate-200">{d.name}照護</th>
                    ))}
                    <th className="px-4 py-3 text-center">當日新接</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStaff.records.map((record, index) => {
                    let sumNew = record.newPatientsOther || 0;
                    activeGroup.departments.forEach(d => sumNew += (record.newPatients?.[d.id] || 0));

                    const isActive = selectedDayIndex === index;
                    return (
                      <tr
                        key={index}
                        onClick={() => setSelectedDayIndex(index)}
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors",
                          isActive ? "bg-sky-50 border-l-4 border-l-sky-600" : "hover:bg-slate-50"
                        )}
                      >
                        <td className={cn("px-4 py-3 font-medium text-slate-700 sticky left-0 border-r border-slate-100", isActive ? "bg-sky-50" : "bg-white")}>{record.date}</td>
                        {activeGroup.departments.map(d => (
                          <td key={d.id} className="px-4 py-3 text-center text-indigo-600 border-r border-slate-100">{record.careCounts?.[d.id] || 0}</td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          {sumNew > 0 ? (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{sumNew}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-5 text-white flex flex-col h-[400px]">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-sky-400"><ClipboardList className="w-5 h-5" /> 附表：新接明細</h3>
            <p className="text-xs text-slate-400 mb-4 pb-4 border-b border-slate-700">請於左側表格點選日期以查看。</p>

            {!selectedRecord ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Pointer className="w-10 h-10 mb-2" />
                <p className="text-sm">尚未選定查看的日期</p>
              </div>
            ) : ((selectedRecord.newBeds || []).length === 0 && sumNewSelected === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <p className="text-sm">{selectedRecord.date} 當日無新接病人紀錄</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium bg-slate-700 px-2 py-1 rounded text-sky-300">{selectedRecord.date}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold flex items-center gap-1">
                    {sumNewSelected !== (selectedRecord.newBeds || []).length && <AlertTriangle className="w-3 h-3 text-amber-300" />}
                    新接填寫 {sumNewSelected} 人 / 明細 {(selectedRecord.newBeds || []).length} 號
                  </span>
                </div>
                <ul className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                  {(selectedRecord.newBeds || []).length > 0 ? (
                    selectedRecord.newBeds.map((bed, idx) => (
                      <li key={idx} className="bg-slate-700 p-3 rounded flex justify-between items-center border border-slate-600">
                        <span className="flex items-center gap-2 text-slate-200"><Bed className="w-4 h-4 text-sky-400" /> {bed}</span>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 text-sm p-2 text-center">無登錄病歷號碼明細</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      {/* 這裡是我們放動態 CMI 設定的地方 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex gap-3 overflow-x-auto custom-scrollbar shadow-sm z-20">
        <div className="font-bold flex items-center text-slate-700 text-sm whitespace-nowrap mr-2">
          <Settings2 className="w-4 h-4 mr-1 text-sky-600" />
          {activeGroup.name} CMI基數:
        </div>
        {activeGroup.departments.map((dept, index) => (
          <div key={dept.id} className={`flex items-center gap-1 bg-${['indigo', 'teal', 'sky', 'rose', 'emerald', 'amber'][index % 6]}-50 px-2 py-1 rounded border border-${['indigo', 'teal', 'sky', 'rose', 'emerald', 'amber'][index % 6]}-100 whitespace-nowrap`}>
            <label className={`text-xs text-${['indigo', 'teal', 'sky', 'rose', 'emerald', 'amber'][index % 6]}-800 font-bold`}>{dept.name}:</label>
            <input
              type="number"
              value={localCmiInputs[dept.id] || '1.000'}
              onChange={(e) => setLocalCmiInputs(prev => ({ ...prev, [dept.id]: e.target.value }))}
              onBlur={() => handleCmiBlur(dept.id)}
              onKeyDown={(e) => handleCmiKeyDown(e, dept.id)}
              step="0.0001"
              className="w-16 bg-white border border-slate-200 text-xs rounded p-1 outline-none text-center font-bold"
            />
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 hidden lg:flex shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">統計人員名單</h2>
            <input
              type="text"
              placeholder="搜尋人員..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredStaffList.map((staff, rank) => {
              const isActive = viewMode === 'staff' && selectedStaffId === staff.id;
              return (
                <button
                  key={staff.id}
                  onClick={() => { setViewMode('staff'); setSelectedStaffId(staff.id); setSelectedDayIndex(null); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex justify-between items-center",
                    isActive ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono w-3">{rank + 1}.</span>
                    <span>{staff.name}</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive ? "bg-sky-200 text-sky-800" : "bg-slate-100 text-slate-500"
                  )}>
                    {staff.totalScore.toFixed(2)}分
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => { setViewMode('overview'); setSelectedStaffId(null); setSelectedDayIndex(null); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200 py-2 rounded text-sm font-medium transition-colors"
            >
              <LayoutGrid className="w-4 h-4" /> 全組總覽
            </button>
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {viewMode === 'overview' ? '全組績效總覽' : `${selectedStaff?.name} - 詳細分析`}
                </h2>
                <p className="text-slate-500 mt-1">雲端資料即時統整計算。</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                  <span className="text-sm text-slate-500 font-bold ml-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> 篩選月份：</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded focus:ring-sky-500 focus:border-sky-500 block p-1.5 outline-none"
                  >
                    {generateMonthOptions()}
                  </select>
                </div>
                <button
                  onClick={onExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> 匯出 Excel
                </button>
              </div>
            </div>

            {viewMode === 'overview' ? renderOverview() : renderStaffDetail()}

          </div>
        </section>
      </div>
    </main>
  );
}
