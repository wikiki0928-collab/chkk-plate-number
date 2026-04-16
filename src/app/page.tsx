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
  updateDoc,
  where,
  limit,
  writeBatch,
  getDoc,
  setDoc 
} from "firebase/firestore";
import { TEACHERS } from "@/lib/constants";
import * as XLSX from "xlsx";

type ViewMode = "survey" | "public_list" | "admin_dashboard";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("survey");
  const [isSurveyOpen, setIsSurveyOpen] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "plate">("name");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Survey States
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehicles, setVehicles] = useState([{ plate: "", model: "" }]);
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
  const [isSyncing, setIsSyncing] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "123456";

  // OPTIMIZED DATA FETCHERS
  const fetchInitialData = async () => {
    // Try to load from cache
    const cached = localStorage.getItem("chkk_staff_cache");
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > 15 * 60 * 1000; // 15 mins cache
        if (!isExpired) {
          setStaffList(data);
          return;
        }
      } catch (e) {
        localStorage.removeItem("chkk_staff_cache");
      }
    }

    setIsLoading(true);
    try {
      // 1. Fetch Survey Status
      const statusDoc = await getDoc(doc(db, "settings", "survey_status"));
      if (statusDoc.exists()) {
        const isOpen = statusDoc.data().isOpen;
        setIsSurveyOpen(isOpen);
        if (!isOpen && viewMode === "survey") {
          setViewMode("public_list");
        }
      }

      // 2. Only fetch unsubmitted staff for the survey
      const qStaff = query(
        collection(db, "staff"), 
        where("hasSubmitted", "!=", true),
        orderBy("hasSubmitted"),
        orderBy("name", "asc")
      );
      const snapStaff = await getDocs(qStaff);
      const data = snapStaff.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setStaffList(data);
      localStorage.setItem("chkk_staff_cache", JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.error("Error fetching initial staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicData = async () => {
    if (registrations.length > 0) return; // Already loaded
    setIsLoading(true);
    try {
      const qReg = query(collection(db, "plate_numbers"), orderBy("createdAt", "desc"));
      const snapReg = await getDocs(qReg);
      setRegistrations(snapReg.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Load ALL staff for management
      const qStaff = query(collection(db, "staff"), orderBy("name", "asc"));
      const snapStaff = await getDocs(qStaff);
      setStaffList(snapStaff.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      
      // Load all registrations
      await loadPublicData();
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle Loading Data on View Change
  useEffect(() => {
    if (viewMode === "public_list") {
      loadPublicData();
    } else if (viewMode === "admin_dashboard" && isAdminAuthenticated) {
      loadAdminData();
    }
  }, [viewMode, isAdminAuthenticated]);

  const submittedNames = useMemo(() => {
    return registrations.map(reg => reg.teacherName);
  }, [registrations]);

  const unsubmittedTeachers = useMemo(() => {
    const namesStaff = staffList.map(s => s.name);
    return namesStaff.filter(name => !submittedNames.includes(name));
  }, [staffList, submittedNames]);

  // Dynamic Row Logic
  const handleAddVehicleRow = () => {
    setVehicles([...vehicles, { plate: "", model: "" }]);
  };

  const handleRemoveVehicleRow = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicle = (index: number, field: "plate" | "model", value: string) => {
    const newVehicles = [...vehicles];
    newVehicles[index][field] = value;
    setVehicles(newVehicles);
  };

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
    
    if (!selectedTeacher) {
      setMessage({ type: "error", text: "请先选择您的姓名。" });
      return;
    }

    if (hasVehicle) {
      const isValid = vehicles.every(v => v.plate.trim() && v.model.trim());
      if (!isValid || vehicles.length === 0) {
        setMessage({ type: "error", text: "请填写完整所有车辆的车牌和型号。" });
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const commonData = {
        teacherName: selectedTeacher,
        createdAt: serverTimestamp(),
      };

      if (!hasVehicle) {
        // No car scenario
        const docRef = await addDoc(collection(db, "plate_numbers"), {
          ...commonData,
          plateNumber: "N/A",
          carModel: "无车辆 (No Vehicle)",
        });
        setRegistrations(prev => [{ id: docRef.id, ...commonData, plateNumber: "N/A", carModel: "无车辆", createdAt: new Date() }, ...prev]);
      } else {
        // Multi car scenario
        const promises = vehicles.map(v => addDoc(collection(db, "plate_numbers"), {
          ...commonData,
          plateNumber: v.plate.trim().toUpperCase(),
          carModel: v.model.trim().toUpperCase(),
        }));
        const results = await Promise.all(promises);
        const newRecords = results.map((ref, i) => ({
          id: ref.id,
          ...commonData,
          plateNumber: vehicles[i].plate.trim().toUpperCase(),
          carModel: vehicles[i].model.trim().toUpperCase(),
          createdAt: new Date()
        }));
        setRegistrations(prev => [...newRecords, ...prev]);
      }

      // Update staff status to true
      const staffDoc = staffList.find(s => s.name === selectedTeacher);
      if (staffDoc) {
        await updateDoc(doc(db, "staff", staffDoc.id), { hasSubmitted: true });
        // Update local state and clear cache
        setStaffList(prev => prev.filter(s => s.id !== staffDoc.id));
        localStorage.removeItem("chkk_staff_cache");
      }

      setMessage({ type: "success", text: "提交成功，感谢您的配合！" });
      setSelectedTeacher("");
      setVehicles([{ plate: "", model: "" }]);
      setHasVehicle(true);
    } catch (error: any) {
      setMessage({ type: "error", text: "提交失败，请检查网络并重试。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Actions
  const startEditing = (reg: any) => {
    setEditingId(reg.id);
    setEditForm({
      teacherName: reg.teacherName,
      plateNumber: reg.plateNumber,
      carModel: reg.carModel
    });
  };

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
      const batch = TEACHERS.map(name => addDoc(collection(db, "staff"), { name, hasSubmitted: false }));
      await Promise.all(batch);
      fetchInitialData();
    } catch (error: any) {
      alert("同步失败: " + error.message);
    }
  };

  const syncSubmissionStatus = async () => {
    if (!window.confirm("这将根据现有登记记录同步所有老师的提交状态。确定开始吗？")) return;
    setIsSyncing(true);
    try {
      // 1. Get all registrations (to know who has submitted)
      const qReg = query(collection(db, "plate_numbers"));
      const snapReg = await getDocs(qReg);
      const submittedNames = new Set(snapReg.docs.map(doc => doc.data().teacherName));

      // 2. Get all staff
      const qStaff = query(collection(db, "staff"));
      const snapStaff = await getDocs(qStaff);
      
      // 3. Update staff in chunks
      const batch = writeBatch(db);
      snapStaff.docs.forEach(staffDoc => {
        const name = staffDoc.data().name;
        batch.update(staffDoc.ref, { hasSubmitted: submittedNames.has(name) });
      });
      
      await batch.commit();
      alert("同步完成！状态已更新。");
      loadAdminData();
    } catch (error: any) {
      alert("同步失败: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSurveyStatus = async () => {
    const newStatus = !isSurveyOpen;
    try {
      await setDoc(doc(db, "settings", "survey_status"), { isOpen: newStatus });
      setIsSurveyOpen(newStatus);
    } catch (error: any) {
      alert("切换失败: " + error.message);
    }
  };

  const filteredRegistrations = useMemo(() => {
    const filtered = registrations.filter(reg => 
      reg.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.carModel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.teacherName.localeCompare(b.teacherName, "zh-Hans");
      } else {
        return a.plateNumber.localeCompare(b.plateNumber);
      }
    });
  }, [registrations, searchQuery, sortBy]);

  return (
    <main className="min-h-screen py-4 md:py-16 px-3 md:px-4 bg-slate-50/20">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-12">
        {/* Unified Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 pb-4 md:pb-12 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">车辆登记管理系统</h1>
              <span className="badge-modern badge-blue hidden md:inline-flex">v3.0 Official</span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide hidden md:block">官方高清字体渲染 · 云端数据实时同步 · 校园安全保障</p>
          </div>
          
          {/* Main Navigation Pill */}
          <div className="nav-pill-container self-start md:self-center w-full md:w-auto">
            {(isSurveyOpen || isAdminAuthenticated) && (
              <button 
                onClick={() => setViewMode("survey")}
                className={`nav-pill-item flex-1 md:flex-none justify-center ${viewMode === 'survey' ? 'nav-pill-item-active' : 'nav-pill-item-inactive'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{!isSurveyOpen ? '🔒' : '📋'}</span>
                  <span className="hidden sm:inline"> {!isSurveyOpen ? '登记已关闭' : '请愿登记'}</span>
                  <span className="sm:hidden text-[10px] font-black">{!isSurveyOpen ? '锁定' : '登记'}</span>
                </div>
              </button>
            )}
            <button 
              onClick={() => setViewMode("public_list")}
              className={`nav-pill-item flex-1 md:flex-none justify-center ${viewMode === 'public_list' ? 'nav-pill-item-active' : 'nav-pill-item-inactive'}`}
            >
              <span className="text-base">📊</span>
              <span className="hidden sm:inline"> 车辆清单</span>
              <span className="sm:hidden text-[10px] font-black">清单</span>
            </button>
            <button 
              onClick={() => setViewMode("admin_dashboard")}
              className={`nav-pill-item flex-1 md:flex-none justify-center ${viewMode === 'admin_dashboard' ? 'nav-pill-item-active' : 'nav-pill-item-inactive'}`}
            >
              <span className="text-base">⚙️</span>
              <span className="hidden sm:inline"> 管理后台</span>
              <span className="sm:hidden text-[10px] font-black">管理</span>
            </button>
          </div>
        </div>

        {/* --- SURVEY MODE --- */}
        {viewMode === "survey" && (
          <div className="space-y-6 md:space-y-16 animate-in">
            <div className="card-modern p-5 md:p-12 relative overflow-hidden">
              {/* Decorative light circle */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
              
              <form onSubmit={handleSubmitSurvey} className="space-y-6 md:space-y-12">
                <div className="space-y-5 md:space-y-10">
                  <div className="space-y-3">
                    <TeacherSelector
                      selectedTeacher={selectedTeacher}
                      onSelect={setSelectedTeacher}
                      teachers={unsubmittedTeachers}
                    />
                    
                    <div 
                      className="flex items-center gap-4 p-5 bg-blue-50 rounded-3xl border-2 border-blue-400 hover:border-blue-500 hover:bg-white transition-all cursor-pointer group shadow-md shadow-blue-100" 
                      onClick={() => setHasVehicle(!hasVehicle)}
                    >
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${!hasVehicle ? 'bg-orange-500 border-orange-500 scale-110 shadow-lg shadow-orange-500/30' : 'bg-white border-slate-200'}`}>
                        {!hasVehicle && <span className="text-white text-sm font-black">✓</span>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-700 tracking-tight">我没有驾驶车辆 (No Vehicle)</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">如果您没有车辆，请勾选此项以完成核对</span>
                      </div>
                    </div>
                  </div>

                  {hasVehicle && (
                    <div className="space-y-10 pt-4 border-t border-slate-100">
                      <div className="form-section-header">
                        <div className="form-section-dot"></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">填写车辆具体信息</span>
                      </div>

                      <div className="space-y-6">
                        {vehicles.map((v, index) => (
                          <div key={index} className="relative space-y-5 md:space-y-8 p-5 md:p-10 border-2 border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-50 transition-all hover:bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 group shadow-sm">
                            {vehicles.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveVehicleRow(index)}
                                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-xl border border-slate-100 hover:bg-rose-500 hover:text-white transition-all z-10 font-bold"
                              >
                                ✕
                              </button>
                            )}
                            <PlateInput value={v.plate} onChange={(val) => updateVehicle(index, "plate", val)} />
                            <CarModelInput value={v.model} onChange={(val) => updateVehicle(index, "model", val)} />
                          </div>
                        ))}

                        <button 
                          type="button"
                          onClick={handleAddVehicleRow}
                          className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-extrabold text-sm hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-3 group"
                        >
                          <span className="text-2xl group-hover:rotate-90 transition-transform duration-500">➕</span> 添加另一辆车 (Add Another)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {message && (
                  <div className={`p-6 rounded-3xl border-2 text-sm font-bold animate-in ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                      {message.text}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full btn-vibrant py-4 md:py-6 text-base md:text-lg uppercase tracking-[0.15em] shadow-xl shadow-orange-500/30 font-black"
                >
                  {isSubmitting ? "正在为您同步云端..." : "🚀 立即提交登记"}
                </button>
              </form>
            </div>

            {/* Pending List Area */}
            <div className="space-y-4">
              {/* Header section */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <h2 className="text-sm font-black text-rose-600 tracking-tight">
                    还没填写的老师 ({unsubmittedTeachers.length} 人)
                  </h2>
                </div>
                <div className="h-[2px] flex-1 bg-rose-100 rounded-full"></div>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold px-1">以下老师尚未提交车牌登记，请提醒他们尽快填写。</p>

              <div className="card-modern overflow-hidden">
                {!isLoading ? (
                  unsubmittedTeachers.length > 0 ? (
                    <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                      {unsubmittedTeachers.map((name, index) => (
                        <div key={name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-rose-50/50 transition-colors group">
                          <span className="w-6 text-[11px] font-black text-slate-300 text-right shrink-0">{index + 1}</span>
                          <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></div>
                          <span className="text-sm font-bold text-slate-700 group-hover:text-rose-700 transition-colors">{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <span className="text-3xl">🎉</span>
                      <p className="text-sm font-black text-emerald-600">所有老师已完成填写！</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">数据同步中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PUBLIC LIST MODE --- */}
        {viewMode === "public_list" && (
          <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">全校车辆资料库</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">已成功采集 {registrations.length} 项登记数据</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortBy("name")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'name' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                >
                  按姓名排序
                </button>
                <button 
                  onClick={() => setSortBy("plate")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'plate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                >
                  按车牌排序
                </button>
              </div>
              <div className="h-[2px] flex-1 bg-slate-100 hidden lg:block"></div>
            </div>
            
            <div className="table-container-modern">
              <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="table-modern">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="bg-slate-50/80 backdrop-blur-md">教职员姓名</th>
                      <th className="bg-slate-50/80 backdrop-blur-md">车牌号码</th>
                      <th className="bg-slate-50/80 backdrop-blur-md">精确车辆型号</th>
                      {isAdminAuthenticated && <th className="bg-slate-50/80 backdrop-blur-md text-right">管理操作</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-black text-[10px] uppercase">
                              {reg.teacherName.charAt(0)}
                            </div>
                            <span className="font-extrabold text-slate-700">{reg.teacherName}</span>
                          </div>
                        </td>
                        <td>
                          {reg.plateNumber === "N/A" ? (
                            <span className="badge-modern badge-blue">无车辆</span>
                          ) : (
                            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-mono text-xs font-black tracking-widest border border-slate-800 shadow-md shadow-slate-900/10">
                              {reg.plateNumber}
                            </span>
                          )}
                        </td>
                        <td><span className="text-xs font-bold text-slate-500">{reg.carModel}</span></td>
                        {isAdminAuthenticated && (
                          <td className="text-right">
                            <button 
                              onClick={() => handleDeleteRecord(reg.id, reg.teacherName)}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                              删除重置
                            </button>
                          </td>
                        )}
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
          <div className="animate-in space-y-12">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto card-modern p-6 md:p-12 space-y-6 md:space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -z-10"></div>
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-3xl mb-4">🔐</div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">安全权限验证</h2>
                  <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">请输入管理员密码以进入控制中心</p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="input-modern text-center tracking-[0.5em]"
                    autoFocus
                  />
                  <button type="submit" className="w-full btn-vibrant py-5 text-sm uppercase tracking-widest font-black">验证并进入系统</button>
                </form>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Admin Sub Nav */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-100">
                  <div className="flex gap-10">
                    <button onClick={() => setActiveAdminTab("records")} className={`text-xs font-black uppercase tracking-widest pb-4 border-b-2 transition-all ${activeAdminTab === 'records' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>
                      📂 数据记录管理
                    </button>
                    <button onClick={() => setActiveAdminTab("staff")} className={`text-xs font-black uppercase tracking-widest pb-4 border-b-2 transition-all ${activeAdminTab === 'staff' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>
                      👥 教职员名册
                    </button>
                  </div>
                  <div className="flex gap-4 pb-4 items-center">
                    <button 
                      onClick={toggleSurveyStatus} 
                      className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${isSurveyOpen ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}
                    >
                      {isSurveyOpen ? "🔓 登记进行中" : "🔒 登记已关闭"}
                    </button>
                    <div className="h-4 w-[2px] bg-slate-100 mx-1"></div>
                    <button onClick={syncSubmissionStatus} disabled={isSyncing} className="btn-secondary-modern text-[11px] uppercase tracking-widest font-black bg-blue-50 text-blue-600 border-blue-200">
                      {isSyncing ? "正在计算中..." : "🔄 同步成员状态"}
                    </button>
                    <button onClick={exportToExcel} className="btn-secondary-modern text-[11px] uppercase tracking-widest font-black">📊 导出数据表格</button>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="px-6 py-3 text-[11px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">安全退出</button>
                  </div>
                </div>

                {activeAdminTab === "records" ? (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500">🔍</span>
                        <input
                          type="text"
                          placeholder="全局搜索任何关键词..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input-modern pl-14"
                        />
                      </div>
                      <div className="px-10 py-5 bg-white border-2 border-slate-50 rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200/20">
                        <span className="text-2xl font-black text-slate-900 mr-3">{registrations.length}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Total Entries</span>
                      </div>
                    </div>
                    
                    <div className="table-container-modern overflow-hidden">
                      <table className="table-modern">
                        <thead>
                          <tr>
                            <th>教职员姓名</th><th>车牌号码</th><th>详细型号</th><th className="text-right">核心管理</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegistrations.map((reg) => (
                            <tr key={reg.id}>
                              <td><span className="font-extrabold text-slate-700">{reg.teacherName}</span></td>
                              <td><span className={reg.plateNumber === 'N/A' ? 'text-slate-300 italic text-xs' : 'px-2 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-black'}>{reg.plateNumber}</span></td>
                              <td><span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{reg.carModel}</span></td>
                              <td className="text-right space-x-4">
                                <button onClick={() => startEditing(reg)} className="text-blue-500 font-black text-[11px] uppercase tracking-widest hover:underline">编辑</button>
                                <button onClick={() => handleDeleteRecord(reg.id, reg.teacherName)} className="text-rose-500 font-black text-[11px] uppercase tracking-widest hover:underline">删除</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row gap-6">
                      <form onSubmit={handleAddStaff} className="flex-1 flex gap-4">
                        <input 
                          type="text" 
                          placeholder="输入老师姓名并添加..." 
                          value={newStaffName} 
                          onChange={(e) => setNewStaffName(e.target.value)} 
                          className="flex-1 input-modern uppercase" 
                        />
                        <button type="submit" className="btn-vibrant px-12 uppercase text-[11px] tracking-widest font-black">添加新人</button>
                      </form>
                      {staffList.length === 0 && (
                        <button onClick={initializeStaffList} className="btn-secondary-modern text-[11px] uppercase tracking-widest text-blue-600 font-black">
                          📥 导入系统初始名单
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {staffList.map((staff) => (
                        <div key={staff.id} className="card-modern p-5 flex items-center justify-between group hover:border-blue-100 transition-all">
                          <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors">{staff.name}</span>
                          <button 
                            onClick={() => handleDeleteStaff(staff.id, staff.name)} 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 hover:bg-rose-50 hover:text-rose-500 transition-all font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <footer className="text-center pt-16 border-t border-slate-100 pb-12">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 opacity-30 group">
              <div className="h-[1px] w-12 bg-slate-300"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">CHKK Unified Multi-Core Registration SPA</span>
              <div className="h-[1px] w-12 bg-slate-300"></div>
            </div>
            <p className="text-[10px] font-bold text-slate-300">© 2026 Admin Panel // Enhanced with SaaS Visual Standards</p>
          </div>
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

