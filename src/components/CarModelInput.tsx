"use client";

interface CarModelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CarModelInput({ value, onChange }: CarModelInputProps) {
  return (
    <div className="w-full space-y-3">
      <label className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
        输入车驾型号
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold tracking-wide"
          placeholder="例如: HONDA CITY / PROTON X70"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight ml-1">
        请填写品牌和型号。
      </p>
    </div>
  );
}
