"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ teacherName: "", plateNumber: "", carModel: "" });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "123456";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
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
      console.error("Firebase Fetch Error:", error);
      setStatusMessage({ 
        type: "error", 
        text: `无法获取数据: ${error.code === 'permission-denied' ? '权限不足（请检查 Firestore 规则）' : error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, teacher: string) => {
    if (window.confirm(`确定要删除 ${teacher} 的记录吗？`)) {
      try {
      await deleteDoc(doc(db, "plate_numbers", id));
      setRegistrations(prev => prev.filter(reg => reg.id !== id));
      setStatusMessage({ type: "success", text: "记录已成功删除。" });
    } catch (error: any) {
      console.error("Delete Error:", error);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await updateDoc(doc(db, "plate_numbers", editingId), editForm);
      setRegistrations(prev => prev.map(reg => reg.id === editingId ? { ...reg, ...editForm } : reg));
      setEditingId(null);
      setStatusMessage({ type: "success", text: "记录已更新。" });
    } catch (error: any) {
      console.error("Update Error:", error);
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
    
    // Auto-size columns
    const colWidths = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 }
    ];
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
      <main className="min-h-screen bg-mesh flex items-center justify-center px-4">
        <div className="glass max-w-md w-full p-10 rounded-[40px] space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-xl">
              🔒
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ADMIN ACCESS</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">请输入管理员密码以继续</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-center"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/10"
            >
              UNLOCK DASHBOARD
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mesh py-12 px-4 md:py-20">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              ADMIN <span className="text-blue-600">DASHBOARD</span>
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Data Management
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={exportToExcel}
              className="glass px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-white transition-all flex items-center gap-2 border-slate-200"
            >
              <span>📊 EXPORT EXCEL</span>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="glass px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all border-rose-100"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-[32px] flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-xl font-black">
              {registrations.length}
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Total Registered</p>
              <p className="text-xl font-black text-slate-800">Vehicle Records</p>
            </div>
          </div>

          <div className="md:col-span-2 glass p-4 rounded-[32px] flex items-center px-6">
            <span className="text-slate-400 mr-4">🔍</span>
            <input
              type="text"
              placeholder="Search by teacher name, plate, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mx-4 p-4 rounded-2xl font-bold text-sm animate-in slide-in-from-top-4 duration-300 ${
            statusMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}>
            {statusMessage.text}
            <button className="float-right hover:opacity-50" onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* Data Table */}
        <div className="glass rounded-[40px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-white">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teacher Name</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plate Number</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Car Model</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Created At</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                      Synchronizing Records...
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-800">{reg.teacherName}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono tracking-wider font-bold">
                          {reg.plateNumber}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{reg.carModel}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                          {reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : "Just now"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        <button
                          onClick={() => startEditing(reg)}
                          className="p-2 hover:bg-blue-50 rounded-xl text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(reg.id, reg.teacherName)}
                          className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass max-w-lg w-full p-8 rounded-[40px] space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">EDIT RECORD</h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Teacher Name</label>
                <select
                  value={editForm.teacherName}
                  onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 focus:border-blue-500 outline-none font-bold"
                >
                  {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Plate Number</label>
                <input
                  type="text"
                  value={editForm.plateNumber}
                  onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 focus:border-blue-500 outline-none font-bold font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Car Model</label>
                <input
                  type="text"
                  value={editForm.carModel}
                  onChange={(e) => setEditForm({ ...editForm, carModel: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-slate-100 text-slate-600 rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
