"use client";

import { useState } from "react";
import TeacherSelector from "@/components/TeacherSelector";
import PlateInput from "@/components/PlateInput";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !plateNumber) {
      setMessage({ type: "error", text: "请确保已选老师并输入车牌号码。" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // If Firebase is not configured yet, this will fail or time out.
      // We check if API key exists to give a better message.
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        throw new Error("Firebase API Key 尚未配置。请联系管理员。");
      }

      await addDoc(collection(db, "plate_numbers"), {
        teacherName: selectedTeacher,
        plateNumber: plateNumber,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "提交成功！感谢您的配合。" });
      setSelectedTeacher("");
      setPlateNumber("");
    } catch (error: any) {
      console.error("Error submitting:", error);
      setMessage({ type: "error", text: error.message || "提交失败，请稍后再试。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-transparent relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            CHKK <span className="text-blue-500">PLATE</span> NUMBER
          </h1>
          <p className="text-gray-400">
            全校老师车牌号码登记系统
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <TeacherSelector
            selectedTeacher={selectedTeacher}
            onSelect={setSelectedTeacher}
          />

          <PlateInput
            value={plateNumber}
            onChange={setPlateNumber}
          />

          {message && (
            <div
              className={`p-4 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center ${
              isSubmitting
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在提交...
              </span>
            ) : (
              "提交记录"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            SECURELY POWERED BY FIREBASE
          </p>
        </div>
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} CHKK Development Team. All rights reserved.
      </footer>
    </main>
  );
}
