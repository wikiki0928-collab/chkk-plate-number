"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-semibold text-slate-700 ml-1">
        车牌号码 <span className="text-red-500">*</span>
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all uppercase font-black tracking-[0.1em] text-xl shadow-inner text-center"
          placeholder="例如: SAB1234A"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-1">
        建议大写，不需要空格。
      </p>
    </div>
  );
}
