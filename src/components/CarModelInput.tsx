"use client";

interface CarModelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CarModelInput({ value, onChange }: CarModelInputProps) {
  return (
    <div className="w-full space-y-2.5">
      <label className="flex items-center text-sm font-bold text-slate-600 px-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-600 mr-2 text-[10px] font-black">3</span>
        车驾型号 <span className="text-red-500 ml-1 opacity-50">*</span>
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-violet-50/30 border-2 border-slate-100 rounded-2xl px-6 py-5 text-violet-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all font-black text-lg"
          placeholder="例如: HONDA CITY / PROTON X70"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-violet-600/60 font-black uppercase tracking-widest ml-2">
        请详细填写您的汽车品牌及型号信息。
      </p>
    </div>
  );
}
