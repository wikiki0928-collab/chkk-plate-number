"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-3">
      <label className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
        输入车牌号码
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all uppercase font-black tracking-[0.15em] text-2xl shadow-inner text-center"
          placeholder="SAB1234A"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight ml-1">
        建议大写，不需要空格。
      </p>
    </div>
  );
}
