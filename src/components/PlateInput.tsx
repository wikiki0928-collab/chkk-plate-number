"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full space-y-3 animate-in">
      <div className="flex items-center justify-between px-2">
        <label className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          🔢 车牌号码 <span className="text-orange-400 ml-1">*</span>
        </label>
      </div>

      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl transition-all duration-500 group-focus-within:scale-125">
          🚗
        </div>
        <input
          type="text"
          className="input-modern pl-16 text-center tracking-[0.3em] text-lg uppercase font-black"
          placeholder="例如: ABC 1234"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
      </div>
      
      <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 w-fit">
        <span className="text-sm mr-2">💡</span>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          请输入您的正式车牌号码，系统将自动纠正大写
        </p>
      </div>
    </div>
  );
}
