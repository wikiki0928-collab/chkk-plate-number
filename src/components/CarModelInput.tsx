"use client";

interface CarModelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CarModelInput({ value, onChange }: CarModelInputProps) {
  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-col space-y-1">
        <label className="flex items-center text-sm font-bold text-slate-700 px-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 mr-2 text-[10px] font-black">车辆型号</span>
          车辆型号 <span className="text-red-500 ml-1 opacity-50">*</span>
        </label>
        <p className="text-[11px] font-bold text-blue-600/80 ml-1 px-1">
          ⚠️ 请务必填写完整型号 (例如: PROTON X50, TOYOTA CAMRY)，切勿只写品牌。
        </p>
      </div>
      <div className="relative group">
        <input
          type="text"
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-base"
          placeholder="例如: PROTON X50 / TOYOTA CAMRY"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
