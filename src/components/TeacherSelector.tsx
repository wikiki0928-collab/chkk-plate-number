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
    <div className="relative w-full space-y-3" ref={containerRef}>
      <label className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
        选择老师姓名
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all font-medium"
          placeholder="搜索或直接输入..."
          value={selectedTeacher || query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && filteredTeachers.length > 0 && (
          <div className="absolute z-30 w-full mt-3 glass border border-white/10 rounded-2xl shadow-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {filteredTeachers.map((teacher) => (
              <button
                key={teacher}
                className="w-full text-left px-6 py-4 text-gray-300 hover:bg-purple-600 hover:text-white transition-all border-b border-white/5 last:border-0 font-semibold"
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
      {(selectedTeacher || query) && (
        <p className="text-[11px] text-purple-400 font-bold uppercase tracking-widest ml-1 animate-in fade-in duration-500">
          {selectedTeacher ? `✓ 已确认: ${selectedTeacher}` : `搜索中: ${query}`}
        </p>
      )}
    </div>
  );
}
