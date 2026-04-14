"use client";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlateInput({ value, onChange }: PlateInputProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-200 mb-2">
        输入车牌号码
      </label>
      <input
        type="text"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase font-bold tracking-widest text-lg"
        placeholder="例如: SAB1234A"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      <p className="mt-2 text-xs text-gray-400">
        请输入完整的车牌号码，不需要空格。
      </p>
    </div>
  );
}
