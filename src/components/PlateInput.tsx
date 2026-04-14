"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300 ml-1">
        <svg 
          className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
        </svg>
        输入车牌号码
      </label>
      <input
        type="text"
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase font-bold tracking-widest text-xl shadow-inner"
        placeholder="例如: SAB1234A"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      <p className="text-[10px] text-gray-500 uppercase tracking-tighter ml-1">
        请输入完整的车牌号码，建议大写，不需要空格。
      </p>
    </div>
  );
}
