// src/components/Common/CustomNumberInput.tsx
import React from 'react';
import { Plus, Minus } from 'lucide-react';

const CustomNumberInput = ({ value, onChange, ...props }) => {
  const handleIncrement = () => {
    const currentValue = parseInt(value, 10) || 0;
    onChange({ target: { value: (currentValue + 1).toString() } });
  };

  const handleDecrement = () => {
    const currentValue = parseInt(value, 10) || 0;
    onChange({ target: { value: Math.max(0, currentValue - 1).toString() } }); // Evita números negativos
  };

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={value}
        onChange={onChange}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-12"
        {...props}
      />
      <div className="absolute right-1 flex flex-col">
        <button type="button" onClick={handleIncrement} className="text-gray-400 hover:text-white transition-colors h-5 flex items-center justify-center">
          <Plus size={14} />
        </button>
        <button type="button" onClick={handleDecrement} className="text-gray-400 hover:text-white transition-colors h-5 flex items-center justify-center">
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};

export default CustomNumberInput;