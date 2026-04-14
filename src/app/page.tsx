"use client";

import { useState, useEffect, useMemo } from "react";
import TeacherSelector from "@/components/TeacherSelector";
import PlateInput from "@/components/PlateInput";
import CarModelInput from "@/components/CarModelInput";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { TEACHERS } from "@/lib/constants";

export default function Home() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittedNames, setSubmittedNames] = useState<string[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, "plate_numbers"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const names = querySnapshot.docs.map(doc => doc.data().teacherName);
      setSubmittedNames(Array.from(new Set(names)));
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const unsubmittedTeachers = useMemo(() => {
    return TEACHERS.filter(name => !submittedNames.includes(name));
  }, [submittedNames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !plateNumber || !carModel) {
      setMessage({ type: "error", text: "请填写并检查所有必填项。" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        throw new Error("系统配置有误，请联系管理员。");
      }

      await addDoc(collection(db, "plate_numbers"), {
        teacherName: selectedTeacher,
        plateNumber: plateNumber,
        carModel: carModel,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "提交成功，感谢您的配合。" });
      setSubmittedNames(prev => Array.from(new Set([selectedTeacher, ...prev])));
      setSelectedTeacher("");
      setPlateNumber("");
      setCarModel("");
    } catch (error: any) {
      console.error("Error submitting:", error);
      setMessage({ type: "error", text: error.message || "提交失败，请重试。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-12">
        {/* Formal Header */}
        <div className="text-center space-y-3 pb-8 border-b border-slate-200">
          <div className="w-12 h-1 bg-blue-600 mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            车辆登记系统
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">
            Campus Vehicle Registration
          </p>
        </div>

        {/* Main Form Box */}
        <div className="card-formal p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">教职员姓名</label>
                <TeacherSelector
                  selectedTeacher={selectedTeacher}
                  onSelect={setSelectedTeacher}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">车牌号码</label>
                <PlateInput
                  value={plateNumber}
                  onChange={setPlateNumber}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">车辆型号</label>
                <CarModelInput
                  value={carModel}
                  onChange={setCarModel}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded border text-sm font-medium ${
                message.type === "success" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full btn-primary disabled:bg-slate-300 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "正在提交..." : "立即提交登记"}
            </button>
          </form>
        </div>

        {/* Pending List Table Style */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">待登记名单 ({unsubmittedTeachers.length})</h2>
            <div className="h-[1px] flex-1 bg-slate-200 ml-6"></div>
          </div>
          
          <div className="card-formal overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-6">
              {isLoadingList ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold animate-pulse">正在同步数据...</div>
              ) : unsubmittedTeachers.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {unsubmittedTeachers.map((name) => (
                    <div key={name} className="flex items-center p-3 border border-slate-100 rounded bg-slate-50/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3"></div>
                      <span className="text-[13px] font-medium text-slate-600 truncate">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <p className="text-sm font-bold text-slate-800">登记已全部完成</p>
                  <p className="text-xs text-slate-400">所有教职员均已录入系统。</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="text-center pt-8">
          <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.3em]">
            CHKK ADMIN // INTERNAL USE ONLY
          </p>
        </footer>
      </div>
    </main>
  );
}
