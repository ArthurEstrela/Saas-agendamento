// src/components/Common/LoginPrompt.tsx
import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginPromptProps {
  message: string;
  onAction: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ message, onAction }) => {
  return (
    <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700 animate-fade-in-down">
      <LogIn size={48} className="mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-white">Ação Protegida</h3>
      <p className="text-sm mt-2 mb-6">{message}</p>
      <button onClick={onAction} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">
        Fazer Login
      </button>
    </div>
  );
};

export default LoginPrompt;
