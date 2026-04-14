"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TEACHERS } from "@/lib/constants";

interface TeacherSelectorProps {
  onSelect: (name: string) => void;
  selectedTeacher: string;
}

export default function TeacherSelector({ onSelect, selectedTeacher }: TeacherSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTeachers = useMemo(() => {
    return TEACHERS.filter((teacher) =>
      teacher.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }, [query]);

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
    <div className="relative w-full space-y-2.5" ref={containerRef}>
      <label className="flex items-center text-sm font-bold text-slate-600 px-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 mr-2 text-[10px] font-black">1</span>
        老师姓名 <span className="text-red-500 ml-1 opacity-50">*</span>
      </label>
      <div className="relative group">
        <div 
          className={`flex items-center w-full bg-blue-50/30 border-2 rounded-2xl px-5 py-4.5 transition-all duration-300 cursor-text ${
            isOpen ? "border-blue-500 shadow-xl bg-white scale-[1.01]" : "border-slate-100 hover:border-blue-200"
          }`}
          onClick={() => setIsOpen(true)}
        >
          <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-slate-900 font-bold placeholder-slate-300"
            placeholder={selectedTeacher || "在此搜索您的姓名..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <svg 
            className={`w-5 h-5 text-blue-300 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-3 bg-white/95 border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher}
                    type="button"
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all mb-1 last:mb-0 flex items-center justify-between ${
                      selectedTeacher === teacher 
                        ? "bg-blue-600 text-white font-black shadow-lg" 
                        : "text-slate-600 hover:bg-blue-50 font-bold"
                    }`}
                    onClick={() => {
                      onSelect(teacher);
                      setQuery("");
                      setIsOpen(false);
                    }}
                  >
                    {teacher}
                    {selectedTeacher === teacher && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-slate-400 font-medium italic">
                  抱歉，未找到相匹配的老师
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedTeacher && !isOpen && (
        <div className="flex items-center text-[11px] text-blue-600 font-black uppercase tracking-widest ml-2 animate-in slide-in-from-left-2">
          <span className="flex w-2 h-2 rounded-full bg-blue-500 mr-2 ring-4 ring-blue-50"></span>
          已确认身份: {selectedTeacher}
        </div>
      )}
    </div>
  );
}
