"use client";

type QuantityStepperProps = {
  value: number;
  min?: number;
  onChange: (value: number) => void;
};

export const QuantityStepper = ({ value, min = 1, onChange }: QuantityStepperProps) => {
  return (
    <div className="flex items-center rounded-full border border-black/10 bg-white">
      <button
        type="button"
        className="px-3 py-1 text-sm font-semibold text-[#7b3b30] hover:text-[#3a231c]"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        -
      </button>
      <span className="px-3 text-sm font-semibold text-[#3a231c]">{value}</span>
      <button
        type="button"
        className="px-3 py-1 text-sm font-semibold text-[#7b3b30] hover:text-[#3a231c]"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
};
