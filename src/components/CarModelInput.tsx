"use client";

interface CarModelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CarModelInput({ value, onChange }: CarModelInputProps) {
  return (
    <div className="w-full space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300 ml-1">
        <svg 
          className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8a2 2 0 012 2v9a1 1 0 01-1 1H5a1 1 0 01-1-1V9a2 2 0 012-2zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h.01M15 12h.01M4 11h16"></path>
        </svg>
        输入汽车型号 (品牌与型号)
      </label>
      <input
        type="text"
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium shadow-inner"
        placeholder="例如: HONDA CITY / PROTON X70"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-gray-500 uppercase tracking-tighter ml-1">
        请填写您目前在学校开的汽车品牌和型号。
      </p>
    </div>
  );
}
