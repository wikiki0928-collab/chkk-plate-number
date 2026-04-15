"use client";

import { useState, useMemo, useRef, useEffect } from "react";
interface TeacherSelectorProps {
  onSelect: (name: string) => void;
  selectedTeacher: string;
  teachers: string[];
}

export default function TeacherSelector({ onSelect, selectedTeacher, teachers }: TeacherSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      teacher.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, teachers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!selectedTeacher) setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedTeacher]);

  return (
    <div className="relative w-full space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between px-2">
        <label className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          👤 请确认您的身份 <span className="text-orange-400 ml-1">*</span>
        </label>
        <span className="badge-modern badge-orange">Security Required</span>
      </div>

      <div className="relative group">
        <div 
          className={`flex items-center w-full bg-white border-2 rounded-[24px] px-6 py-4.5 transition-all duration-500 cursor-text shadow-sm ${
            isOpen ? "border-brand-orange shadow-2xl shadow-orange-500/10 scale-[1.01]" : "border-slate-300 hover:border-slate-400"
          }`}
          onClick={() => setIsOpen(true)}
        >
          <span className={`text-xl mr-3 transition-transform duration-500 ${isOpen ? "scale-125" : ""}`}>👤</span>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-slate-900 font-extrabold placeholder-slate-300 text-base"
            placeholder={selectedTeacher || "在此输入您的姓名搜索..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <svg 
            className={`w-5 h-5 text-slate-300 transition-transform duration-500 ${isOpen ? "rotate-180 text-orange-500" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-3 bg-white/95 border border-slate-100 rounded-[30px] shadow-2xl overflow-hidden backdrop-blur-xl animate-in">
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-3">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher}
                    type="button"
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all mb-1 last:mb-0 flex items-center justify-between ${
                      selectedTeacher === teacher 
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black shadow-lg shadow-orange-500/20" 
                        : "text-slate-600 hover:bg-slate-50 font-bold"
                    }`}
                    onClick={() => {
                      onSelect(teacher);
                      setQuery("");
                      setIsOpen(false);
                    }}
                  >
                    {teacher}
                    {selectedTeacher === teacher && (
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-5 py-12 text-center text-slate-300 font-bold italic">
                   🙅 未找到相关姓名
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {selectedTeacher && !isOpen && (
        <div className="flex items-center px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50 w-fit animate-in">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3 shadow-lg shadow-blue-500/50"></div>
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
            正在为 {selectedTeacher} 办理登记
          </span>
        </div>
      )}
    </div>

  );
}
