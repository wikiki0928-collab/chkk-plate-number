"use client";

interface CarModelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CarModelInput({ value, onChange }: CarModelInputProps) {
  return (
    <div className="w-full space-y-4 animate-in">
      <div className="flex flex-col space-y-3 px-2">
        <label className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          🏷️ 详细车辆型号 <span className="text-orange-400 ml-1">*</span>
        </label>
        
        <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3">
          <span className="text-lg">💡</span>
          <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider leading-relaxed">
            请务必填入 <span className="text-blue-800">完整型号</span> (例如: PROTON X50, TOYOTA CAMRY)，切勿仅提交品牌名称。
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl transition-all duration-500 group-focus-within:scale-125">
          🚘
        </div>
        <input
          type="text"
          className="input-modern pl-16 font-black text-slate-700"
          placeholder="例如: PROTON X50 / TOYOTA CAMRY"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
