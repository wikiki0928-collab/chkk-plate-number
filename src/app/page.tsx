"use client";

import { useState } from "react";
import TeacherSelector from "@/components/TeacherSelector";
import PlateInput from "@/components/PlateInput";
import CarModelInput from "@/components/CarModelInput";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !plateNumber || !carModel) {
      setMessage({ type: "error", text: "所有字段均为必填项，请补充完整。" });
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

      setMessage({ type: "success", text: "已成功记录您的车牌信息。感谢配合！" });
      setSelectedTeacher("");
      setPlateNumber("");
      setCarModel("");
    } catch (error: any) {
      console.error("Error submitting:", error);
      setMessage({ type: "error", text: error.message || "提交失败，请检查网络连接。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-grid">
      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 glass-dark mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-gradient leading-tight">
            CHKK ADMIN<br/><span className="text-blue-500">SURVEY</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-wide">
            全校老师车牌号码及车型登记
          </p>
        </div>

        {/* Form section */}
        <form onSubmit={handleSubmit} className="glass rounded-[40px] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="space-y-6">
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
          </div>

          {message && (
            <div
              className={`p-5 rounded-2xl text-sm font-semibold animate-in zoom-in-95 duration-300 flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative w-full py-5 px-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all overflow-hidden ${
              isSubmitting
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-white/20"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="relative z-10">提交登记信息</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </form>

        <footer className="pt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
            <span className="h-px w-8 bg-gray-800"></span>
            Cloud Secure Infrastructure
            <span className="h-px w-8 bg-gray-800"></span>
          </div>
          <p className="text-gray-600 text-[10px] font-medium">
            &copy; {new Date().getFullYear()} CHKK CAMPUS OPS. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </main>
  );
}
