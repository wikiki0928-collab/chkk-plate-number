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
    <main className="relative flex min-h-screen flex-col items-center bg-mesh py-12 px-4 md:py-20 lg:py-24">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-blue-300 rounded-full blur-[140px] opacity-25 animate-blob"></div>
        <div className="absolute top-[10%] right-[-15%] w-[50%] h-[50%] bg-purple-300 rounded-full blur-[140px] opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-15%] left-[10%] w-[55%] h-[55%] bg-emerald-200 rounded-full blur-[140px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 w-full max-w-[540px] space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Header section with more style */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] bg-white shadow-2xl shadow-blue-500/10 border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 cursor-default">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
            CHKK ADMIN<br/><span className="text-blue-600 underline decoration-blue-200 underline-offset-8">SURVEY</span>
          </h1>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
            CAMPUS VEHICLE REGISTRATION SYSTEM
          </p>
        </div>

        {/* Main Form Card */}
        <div className="glass rounded-[48px] p-8 md:p-12 space-y-10 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          
          <form onSubmit={handleSubmit} className="space-y-10">
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
                className={`p-5 rounded-2xl text-sm font-black animate-in zoom-in-95 duration-300 flex items-center gap-4 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${message.type === "success" ? "bg-emerald-100" : "bg-rose-100"}`}>
                  {message.type === "success" ? "✓" : "!"}
                </span>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full py-5 px-6 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-[0.97] overflow-hidden ${
                isSubmitting
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] hover:shadow-blue-500/20"
              }`}
            >
              {isSubmitting ? (
                "PROCESSING..."
              ) : (
                <>
                  <span className="relative z-10">SUBMIT REGISTRATION</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Waitlist Section with Fixed Layout */}
        <div className="space-y-8 animate-in delay-500 duration-1000 fill-mode-both">
          <div className="flex items-center gap-6 px-4">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex-shrink-0">
              PENDING LIST ({unsubmittedTeachers.length})
            </h2>
            <div className="h-px flex-1 bg-slate-200/50"></div>
          </div>
          
          <div className="glass overflow-hidden rounded-[40px] p-6 min-h-[240px] max-h-[600px] flex flex-col">
            {isLoadingList ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                SYNCING DATA...
              </div>
            ) : unsubmittedTeachers.length > 0 ? (
              <div className="w-full overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 md:grid-cols-2 gap-4">
                {unsubmittedTeachers.map((name) => (
                  <div 
                    key={name}
                    className="glass-pill flex items-center px-4 py-4 rounded-2xl truncate transition-all hover:scale-[1.03] hover:shadow-xl hover:border-blue-400 group"
                    title={name}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mr-3 group-hover:bg-blue-500 transition-colors"></span>
                    <span className="text-xs font-black text-slate-600 group-hover:text-blue-900 truncate leading-relaxed">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-4xl shadow-inner">🎉</div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Completed!</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">All teachers have checked in.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center pt-8 space-y-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            SYSTEM V2.0 // CHKK OPS
          </p>
        </footer>
      </div>
    </main>
  );
}
