"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-2.5">
      <label className="flex items-center text-sm font-bold text-slate-700 px-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 mr-2 text-[10px] font-black">车牌号码</span>
        车牌号码 <span className="text-red-500 ml-1 opacity-50">*</span>
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all uppercase font-bold text-base tracking-widest text-center"
          placeholder="例如: SAB1234A"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
      </div>
      <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-widest ml-2">
        无需空格，系统会自动转为大写。
      </p>
    </div>
  );
}
