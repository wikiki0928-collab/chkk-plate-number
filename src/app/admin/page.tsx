"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc,
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { TEACHERS } from "@/lib/constants";

interface Registration {
  id: string;
  teacherName: string;
  plateNumber: string;
  carModel: string;
  createdAt: any;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"registrations" | "staff">("registrations");
  
  // Registration States
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ teacherName: "", plateNumber: "", carModel: "" });
  
  // Staff States
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "123456";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
      fetchStaff();
    } else {
      alert("密码错误，请重试。");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "plate_numbers"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(data);
    } catch (error: any) {
      console.error("Fetch Data Error:", error);
      setStatusMessage({ type: "error", text: `无法获取登记数据: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const q = query(collection(db, "staff"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setStaffList(data);
    } catch (error: any) {
      console.error("Fetch Staff Error:", error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAddStaff = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newStaffName.trim()) return;
    
    try {
      const name = newStaffName.trim().toUpperCase();
      await addDoc(collection(db, "staff"), { name });
      setNewStaffName("");
      fetchStaff();
      setStatusMessage({ type: "success", text: `已成功添加: ${name}` });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `添加失败: ${error.message}` });
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`确定要从名单中删除 ${name} 吗？`)) {
      try {
        await deleteDoc(doc(db, "staff", id));
        setStaffList(prev => prev.filter(s => s.id !== id));
        setStatusMessage({ type: "success", text: "名单已更新。" });
      } catch (error: any) {
        setStatusMessage({ type: "error", text: `删除失败: ${error.message}` });
      }
    }
  };

  const initializeStaffList = async () => {
    if (!window.confirm("这将把代码里的 116 人名单同步到数据库。确定执行吗？")) return;
    
    setIsLoadingStaff(true);
    try {
      const batch = TEACHERS.map(name => addDoc(collection(db, "staff"), { name }));
      await Promise.all(batch);
      fetchStaff();
      setStatusMessage({ type: "success", text: "已成功初始化 116 人名单。" });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `初始化失败: ${error.message}` });
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleDeleteRecord = async (id: string, teacher: string) => {
    if (window.confirm(`确定要删除 ${teacher} 的记录吗？`)) {
      try {
        await deleteDoc(doc(db, "plate_numbers", id));
        setRegistrations(prev => prev.filter(reg => reg.id !== id));
        setStatusMessage({ type: "success", text: "记录已成功删除。" });
      } catch (error: any) {
        setStatusMessage({ type: "error", text: `删除失败: ${error.message}` });
      }
    }
  };

  const startEditing = (reg: Registration) => {
    setEditingId(reg.id);
    setEditForm({
      teacherName: reg.teacherName,
      plateNumber: reg.plateNumber,
      carModel: reg.carModel
    });
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await updateDoc(doc(db, "plate_numbers", editingId), editForm);
      setRegistrations(prev => prev.map(reg => reg.id === editingId ? { ...reg, ...editForm } : reg));
      setEditingId(null);
      setStatusMessage({ type: "success", text: "记录已更新。" });
    } catch (error: any) {
      setStatusMessage({ type: "error", text: `更新失败: ${error.message}` });
    }
  };

  const exportToExcel = () => {
    const dataToExport = registrations.map(reg => ({
      "教师姓名": reg.teacherName,
      "车牌号码": reg.plateNumber,
      "车辆型号": reg.carModel,
      "提交时间": reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : "未知"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plate Numbers");
    
    const colWidths = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `CHKK_Plate_Numbers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => 
      reg.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.carModel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [registrations, searchQuery]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card-formal max-w-sm w-full p-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">管理员登录</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Administrative Access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="input-formal text-center"
              autoFocus
            />
            <button type="submit" className="w-full btn-primary">验证并进入</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 bg-slate-50/50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">管理后台</h1>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab("registrations")}
                className={`text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'registrations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              >
                登记记录
              </button>
              <button 
                onClick={() => setActiveTab("staff")}
                className={`text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'staff' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              >
                教职员名单管理
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'registrations' && (
              <button onClick={exportToExcel} className="btn-secondary text-xs flex items-center gap-2">
                <span>📊 导出资料 (EXCEL)</span>
              </button>
            )}
            <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700">
              退出登录
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded border text-sm font-bold ${
            statusMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
          }`}>
            {statusMessage.text}
            <button className="float-right" onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {activeTab === "registrations" ? (
          /* Registrations Tab */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索教师、车牌或型号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-formal"
                />
              </div>
              <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase">当前记录</span>
                <span className="text-sm font-black text-slate-800">{registrations.length}</span>
              </div>
            </div>

            <div className="table-container shadow-sm">
              <table className="formal">
                <thead>
                  <tr>
                    <th>教师姓名</th>
                    <th>车牌号码</th>
                    <th>车辆型号</th>
                    <th>提交时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-bold uppercase animate-pulse">正在加载...</td></tr>
                  ) : filteredRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td><span className="font-bold text-slate-700">{reg.teacherName}</span></td>
                      <td><span className="px-2 py-1 bg-slate-100 text-slate-800 rounded font-mono text-xs font-bold border border-slate-200">{reg.plateNumber}</span></td>
                      <td><span className="text-xs text-slate-600 font-medium">{reg.carModel}</span></td>
                      <td><span className="text-[11px] text-slate-400 font-medium">{reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : "刚刚"}</span></td>
                      <td className="text-right space-x-4">
                        <button onClick={() => startEditing(reg)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">编辑</button>
                        <button onClick={() => handleDeleteRecord(reg.id, reg.teacherName)} className="text-rose-600 hover:text-rose-800 text-xs font-bold">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Staff Management Tab */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleAddStaff} className="flex-1 flex gap-3">
                <input
                  type="text"
                  placeholder="输入新进老师姓名 (例如: TAN AH KOW)"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="input-formal uppercase"
                />
                <button type="submit" className="btn-primary whitespace-nowrap text-xs uppercase px-8">添加老师</button>
              </form>
              {staffList.length === 0 && (
                <button onClick={initializeStaffList} className="btn-secondary text-xs uppercase px-8 text-blue-600 border-blue-200">
                  ⚠️ 从代码导入初始 116 人名单
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingStaff ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold animate-pulse">正在读取名单...</div>
              ) : staffList.length === 0 ? (
                <div className="col-span-full py-20 card-formal text-center text-slate-400 italic">名单为空，请手动添加或点击上方“导入初始化”。</div>
              ) : staffList.map((staff) => (
                <div key={staff.id} className="card-formal p-4 flex items-center justify-between group hover:border-blue-200 transition-colors">
                  <span className="text-sm font-bold text-slate-700">{staff.name}</span>
                  <button 
                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                    className="text-slate-300 hover:text-rose-600 transition-colors"
                    title="删除此老师"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="card-formal max-w-lg w-full p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">修改登记资料</h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">教师姓名</label>
                <select
                  value={editForm.teacherName}
                  onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                  className="input-formal"
                >
                  <option value={editForm.teacherName}>{editForm.teacherName}</option>
                  {staffList.filter(s => s.name !== editForm.teacherName).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  {TEACHERS.filter(t => t !== editForm.teacherName && !staffList.find(s => s.name === t)).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">车牌号码</label>
                <input
                  type="text"
                  value={editForm.plateNumber}
                  onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value.toUpperCase() })}
                  className="input-formal font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">车辆型号</label>
                <input
                  type="text"
                  value={editForm.carModel}
                  onChange={(e) => setEditForm({ ...editForm, carModel: e.target.value })}
                  className="input-formal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingId(null)} className="flex-1 btn-secondary text-sm">取消</button>
                <button type="submit" className="flex-1 btn-primary text-sm">提交修改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
