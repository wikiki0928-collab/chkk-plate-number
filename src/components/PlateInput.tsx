"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-2.5">
      <label className="flex items-center text-sm font-bold text-slate-600 px-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 mr-2 text-[10px] font-black">2</span>
        车牌号码 <span className="text-red-500 ml-1 opacity-50">*</span>
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-emerald-50/30 border-2 border-slate-100 rounded-2xl px-6 py-5 text-emerald-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all uppercase font-black tracking-[0.2em] text-2xl shadow-inner text-center"
          placeholder="SAB1234A"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-emerald-600/60 font-black uppercase tracking-widest ml-2">
        无需空格，建议使用大写字母。
      </p>
    </div>
  );
}
