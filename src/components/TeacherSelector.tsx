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
    if (query === "") return [];
    return TEACHERS.filter((teacher) =>
      teacher.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      <label className="flex items-center text-sm font-medium text-gray-300 ml-1">
        <svg 
          className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        选择老师姓名
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-inner"
          placeholder="搜索或输入姓名..."
          value={selectedTeacher || query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && filteredTeachers.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in duration-200">
            {filteredTeachers.map((teacher) => (
              <button
                key={teacher}
                className="w-full text-left px-5 py-4 text-gray-200 hover:bg-purple-600 hover:text-white transition-all border-b border-white/5 last:border-0 font-medium"
                onClick={() => {
                  onSelect(teacher);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                {teacher}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedTeacher && (
        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest ml-1 animate-pulse">
          ✓ 已选择: {selectedTeacher}
        </p>
      )}
    </div>
  );
}
