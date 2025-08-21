// src/components/LoginModal.tsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void; // Função para ser chamada após o login
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Login realizado com sucesso!', 'success');
      onLoginSuccess(); // Avisa o componente pai que o login foi feito
      onClose(); // Fecha o modal
    } catch (error) {
      console.error(error);
      showToast('Falha no login. Verifique suas credenciais.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white text-center mb-6">Faça login para continuar</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#daa520] focus:outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#daa520] focus:outline-none"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#daa520] hover:bg-[#c8961e] text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#daa520]/20"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;