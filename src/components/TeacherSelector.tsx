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
        // If nothing was selected, reset query
        if (!selectedTeacher) setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedTeacher]);

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      <label className="block text-sm font-semibold text-slate-700 ml-1">
        老师姓名 <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div 
          className={`flex items-center w-full bg-slate-50 border rounded-2xl px-5 py-4 transition-all duration-200 cursor-text ${
            isOpen ? "border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.1)] bg-white" : "border-slate-200 hover:border-slate-300"
          }`}
          onClick={() => setIsOpen(true)}
        >
          <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-slate-900 font-medium placeholder-slate-400"
            placeholder={selectedTeacher || "点击搜索您的姓名..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher}
                    type="button"
                    className={`w-full text-left px-5 py-4 text-slate-700 hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between ${
                      selectedTeacher === teacher ? "bg-sky-50 text-sky-700 font-bold" : "font-medium"
                    }`}
                    onClick={() => {
                      onSelect(teacher);
                      setQuery("");
                      setIsOpen(false);
                    }}
                  >
                    {teacher}
                    {selectedTeacher === teacher && (
                      <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-slate-400">
                  没有找到相关老师
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedTeacher && !isOpen && (
        <div className="flex items-center text-[11px] text-sky-600 font-bold uppercase tracking-wider ml-1 animate-in fade-in">
          <span className="w-1 h-1 rounded-full bg-sky-500 mr-1.5"></span>
          已选定: {selectedTeacher}
        </div>
      )}
    </div>
  );
}
