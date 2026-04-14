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

  // Fetch initial submitted names
  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, "plate_numbers"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const names = querySnapshot.docs.map(doc => doc.data().teacherName);
      setSubmittedNames(Array.from(new Set(names))); // Unique names
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
      setMessage({ type: "error", text: "所有字段均为必填项，请填写完整。" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        throw new Error("配置文件缺失，请联系管理员。");
      }

      await addDoc(collection(db, "plate_numbers"), {
        teacherName: selectedTeacher,
        plateNumber: plateNumber,
        carModel: carModel,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "提交成功！感谢您的配合。" });
      
      // Update local submitted names to reflect change immediately
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
    <main className="relative flex min-h-screen flex-col items-center bg-grid-light py-12 px-4 md:py-24">
      {/* Soft Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-sky-100 rounded-full blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      </div>

      <div className="z-10 w-full max-w-[500px] space-y-12">
        {/* Header section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm border border-slate-100 mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            CHKK 车牌号码登记
          </h1>
          <p className="text-slate-500 font-medium">
            全校老师车牌号码及车型例行调查
          </p>
        </div>

        {/* Form section */}
        <div className="glass rounded-[32px] p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form onSubmit={handleSubmit} className="space-y-8">
            <TeacherSelector
              selectedTeacher={selectedTeacher}
              onSelect={setSelectedTeacher}
            />

            <PlateInput
              value={plateNumber}
              onChange={setPlateNumber}
            />

            <CarModelInput
              value={carModel}
              onChange={setCarModel}
            />

            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-bold animate-in fade-in duration-300 flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {message.type === "success" ? "✓" : "!"} {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4.5 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                isSubmitting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200"
              }`}
            >
              {isSubmitting ? "处理中..." : "提交登记记录"}
            </button>
          </form>
        </div>

        {/* Waitlist section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
              待填写老师名单 ({unsubmittedTeachers.length})
            </h2>
            <div className="h-px flex-1 bg-slate-100 mx-4"></div>
          </div>
          
          <div className="glass-dark rounded-3xl overflow-hidden min-h-[100px] max-h-[400px] flex flex-col items-center justify-center p-2">
            {isLoadingList ? (
              <div className="p-12 text-slate-400 text-sm animate-pulse">
                正在加载名单...
              </div>
            ) : unsubmittedTeachers.length > 0 ? (
              <div className="w-full overflow-y-auto custom-scrollbar p-6 grid grid-cols-2 gap-4">
                {unsubmittedTeachers.map((name) => (
                  <div 
                    key={name}
                    className="truncate text-[11px] font-bold text-slate-500 bg-white shadow-sm border border-slate-100 px-3 py-2 rounded-lg"
                  >
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <div className="text-2xl">🎉</div>
                <p className="text-sm font-bold text-slate-600">所有老师已填妥！</p>
                <p className="text-xs text-slate-400 font-medium">感谢各位老师的配合</p>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center pt-8">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} CHKK Administration Unit
          </p>
        </footer>
      </div>
    </main>
  );
}
