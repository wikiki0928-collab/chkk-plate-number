"use client";

import { useState, useEffect, useMemo } from "react";
import TeacherSelector from "@/components/TeacherSelector";
import PlateInput from "@/components/PlateInput";
import CarModelInput from "@/components/CarModelInput";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { TEACHERS } from "@/lib/constants";
import * as XLSX from "xlsx";

type ViewMode = "survey" | "public_list" | "admin_dashboard";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("survey");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Survey States
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data States
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Specific States
  const [activeAdminTab, setActiveAdminTab] = useState<"records" | "staff">("records");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ teacherName: "", plateNumber: "", carModel: "" });
  const [newStaffName, setNewStaffName] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "123456";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch registrations
      const qReg = query(collection(db, "plate_numbers"), orderBy("createdAt", "desc"));
      const snapReg = await getDocs(qReg);
      const docsReg = snapReg.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegistrations(docsReg);

      // Fetch staff list
      const qStaff = query(collection(db, "staff"), orderBy("name", "asc"));
      const snapStaff = await getDocs(qStaff);
      const docsStaff = snapStaff.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setStaffList(docsStaff);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submittedNames = useMemo(() => {
    return registrations.map(reg => reg.teacherName);
  }, [registrations]);

  const unsubmittedTeachers = useMemo(() => {
    const namesStaff = staffList.map(s => s.name);
    return namesStaff.filter(name => !submittedNames.includes(name));
  }, [staffList, submittedNames]);

  // Auth Handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setPassword("");
    } else {
      alert("密码错误，请重试。");
    }
  };

  // Survey Submission
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !plateNumber || !carModel) {
      setMessage({ type: "error", text: "请填写并检查所有必填项。" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const newDoc = {
        teacherName: selectedTeacher,
        plateNumber: plateNumber,
        carModel: carModel,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "plate_numbers"), newDoc);
      setMessage({ type: "success", text: "提交成功，感谢您的配合。" });
      setRegistrations(prev => [{ id: docRef.id, ...newDoc, createdAt: new Date() }, ...prev]);
      setSelectedTeacher("");
      setPlateNumber("");
      setCarModel("");
    } catch (error: any) {
      setMessage({ type: "error", text: "提交失败，请重试。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Actions: Records
  const handleDeleteRecord = async (id: string, teacher: string) => {
    if (window.confirm(`确定要删除 ${teacher} 的记录吗？`)) {
      try {
        await deleteDoc(doc(db, "plate_numbers", id));
        setRegistrations(prev => prev.filter(reg => reg.id !== id));
      } catch (error: any) {
        alert("删除失败: " + error.message);
      }
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateDoc(doc(db, "plate_numbers", editingId), editForm);
      setRegistrations(prev => prev.map(reg => reg.id === editingId ? { ...reg, ...editForm } : reg));
      setEditingId(null);
    } catch (error: any) {
      alert("更新失败: " + error.message);
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

  // Admin Actions: Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    try {
      const name = newStaffName.trim().toUpperCase();
      const docRef = await addDoc(collection(db, "staff"), { name });
      setStaffList(prev => [...prev, { id: docRef.id, name }].sort((a,b) => a.name.localeCompare(b.name)));
      setNewStaffName("");
    } catch (error: any) {
      alert("添加失败: " + error.message);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`确定要删除老师 ${name} 吗？`)) {
      try {
        await deleteDoc(doc(db, "staff", id));
        setStaffList(prev => prev.filter(s => s.id !== id));
      } catch (error: any) {
        alert("删除失败: " + error.message);
      }
    }
  };

  const initializeStaffList = async () => {
    if (!window.confirm("这将从备份中导入 116 人名单，确定吗？")) return;
    try {
      const batch = TEACHERS.map(name => addDoc(collection(db, "staff"), { name }));
      await Promise.all(batch);
      fetchData();
    } catch (error: any) {
      alert("同步失败: " + error.message);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => 
      reg.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.carModel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [registrations, searchQuery]);

  return (
    <main className="min-h-screen py-8 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Unified Header */}
        <div className="text-center space-y-3 pb-8 border-b border-slate-200">
          <div className="w-12 h-1 bg-blue-600 mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">车辆登记管理系统</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">CHKK Campus Vehicle Registration // SPA v3.0</p>
        </div>

        {/* Global Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button 
            onClick={() => setViewMode("survey")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'survey' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            📝 登记表单
          </button>
          <button 
            onClick={() => setViewMode("public_list")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'public_list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            🔍 已收名单
          </button>
          <button 
            onClick={() => setViewMode("admin_dashboard")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'admin_dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            ⚙️ 管理后台
          </button>
        </div>

        {/* --- SURVEY MODE --- */}
        {viewMode === "survey" && (
          <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card-formal p-8 md:p-10">
              <form onSubmit={handleSubmitSurvey} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <TeacherSelector
                      selectedTeacher={selectedTeacher}
                      onSelect={setSelectedTeacher}
                      teachers={unsubmittedTeachers}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">车牌号码</label>
                    <PlateInput value={plateNumber} onChange={setPlateNumber} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">车辆型号</label>
                    <CarModelInput value={carModel} onChange={setCarModel} />
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded border text-sm font-medium animate-in zoom-in-95 duration-200 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    {message.text}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full btn-primary disabled:bg-slate-300 text-sm uppercase tracking-widest">
                  {isSubmitting ? "正在提交..." : "立即提交登记"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">待登记名单 ({unsubmittedTeachers.length})</h2>
                <div className="h-[1px] flex-1 bg-slate-200 ml-6"></div>
              </div>
              <div className="card-formal overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-6">
                  {!isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {unsubmittedTeachers.map((name) => (
                        <div key={name} className="flex items-center p-3 border border-slate-100 rounded bg-slate-50/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3"></div>
                          <span className="text-[13px] font-medium text-slate-600 truncate">{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-8 text-slate-400 animate-pulse uppercase text-xs font-bold">同步中...</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PUBLIC LIST MODE --- */}
        {viewMode === "public_list" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">全校已登记车辆 (共 {registrations.length} 项)</h2>
              <div className="h-[1px] flex-1 bg-slate-200 ml-6"></div>
            </div>
            <div className="table-container shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="formal">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="bg-slate-50">教师姓名</th>
                      <th className="bg-slate-50">车牌号码</th>
                      <th className="bg-slate-50">车辆型号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td><span className="font-bold text-slate-700">{reg.teacherName}</span></td>
                        <td><span className="px-2 py-1 bg-slate-100 text-slate-800 rounded font-mono text-xs font-bold border border-slate-200">{reg.plateNumber}</span></td>
                        <td><span className="text-xs text-slate-600 font-medium">{reg.carModel}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN DASHBOARD MODE --- */}
        {viewMode === "admin_dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto card-formal p-10 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 uppercase">身份验证</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">请输入管理员密码以开启管理权限</p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="input-formal text-center"
                    autoFocus
                  />
                  <button type="submit" className="w-full btn-primary font-bold">解锁进入</button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admin Sub Navigation */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
                  <div className="flex gap-6">
                    <button onClick={() => setActiveAdminTab("records")} className={`text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b-2 transition-all ${activeAdminTab === 'records' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>数据管理</button>
                    <button onClick={() => setActiveAdminTab("staff")} className={`text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b-2 transition-all ${activeAdminTab === 'staff' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>人员名单</button>
                  </div>
                  <div className="flex gap-3 pb-3">
                    <button onClick={exportToExcel} className="btn-secondary text-[10px] uppercase font-bold px-4 py-2 border-blue-200 text-blue-600">📊 导出 EXCEL</button>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="px-4 py-2 text-[10px] font-bold text-rose-600 uppercase">退出登录</button>
                  </div>
                </div>

                {activeAdminTab === "records" ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <input
                        type="text"
                        placeholder="搜索记录..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 input-formal"
                      />
                      <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm text-slate-800">{registrations.length} 条记录</div>
                    </div>
                    <div className="table-container shadow-sm">
                      <table className="formal">
                        <thead>
                          <tr>
                            <th>姓名</th><th>车牌</th><th>型号</th><th className="text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegistrations.map((reg) => (
                            <tr key={reg.id}>
                              <td><span className="font-bold">{reg.teacherName}</span></td>
                              <td><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono text-xs font-bold">{reg.plateNumber}</span></td>
                              <td><span className="text-xs text-slate-500">{reg.carModel}</span></td>
                              <td className="text-right space-x-3">
                                <button onClick={() => startEditing(reg)} className="text-blue-600 font-bold text-xs">编辑</button>
                                <button onClick={() => handleDeleteRecord(reg.id, reg.teacherName)} className="text-rose-600 font-bold text-xs">删除</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <form onSubmit={handleAddStaff} className="flex-1 flex gap-2">
                        <input type="text" placeholder="添加新教师..." value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="flex-1 input-formal uppercase" />
                        <button type="submit" className="btn-primary text-[10px] px-8 uppercase">添加</button>
                      </form>
                      {staffList.length === 0 && <button onClick={initializeStaffList} className="btn-secondary text-[10px] px-6 uppercase text-blue-600 border-blue-200">一键导入初始化名单</button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {staffList.map((staff) => (
                        <div key={staff.id} className="card-formal p-4 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{staff.name}</span>
                          <button onClick={() => handleDeleteStaff(staff.id, staff.name)} className="text-slate-300 hover:text-rose-600">🗑️</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <footer className="text-center pt-8 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.3em]">CHKK ADMIN SPA // UNIFIED PANEL</p>
        </footer>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="card-formal max-w-lg w-full p-8 space-y-6">
            <h2 className="text-lg font-bold">编辑记录</h2>
            <form onSubmit={handleUpdateRecord} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">教师姓名</label>
                <select value={editForm.teacherName} onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })} className="input-formal">
                  <option value={editForm.teacherName}>{editForm.teacherName}</option>
                  {staffList.filter(s => s.name !== editForm.teacherName).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">车牌号码</label>
                <input type="text" value={editForm.plateNumber} onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value.toUpperCase() })} className="input-formal font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">车辆型号</label>
                <input type="text" value={editForm.carModel} onChange={(e) => setEditForm({ ...editForm, carModel: e.target.value })} className="input-formal" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingId(null)} className="flex-1 btn-secondary text-sm">取消</button>
                <button type="submit" className="flex-1 btn-primary text-sm">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

