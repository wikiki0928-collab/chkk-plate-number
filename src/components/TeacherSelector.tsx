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
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        选择老师姓名
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          <div className="absolute z-10 w-full mt-2 bg-gray-900/95 border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-200">
            {filteredTeachers.map((teacher) => (
              <button
                key={teacher}
                className="w-full text-left px-4 py-3 text-gray-200 hover:bg-blue-600 hover:text-white transition-colors border-b border-white/5 last:border-0"
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
        <p className="mt-2 text-sm text-blue-400 font-medium">
          已选择: {selectedTeacher}
        </p>
      )}
    </div>
  );
}
