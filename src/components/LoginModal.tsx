import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Loader2, Mail, Lock, User, Building } from 'lucide-react';
import styloLogo from '../assets/stylo-logo.png';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const { login, register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // States para os campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginView) {
        // --- LÓGICA DE LOGIN ---
        await login(email, password);
        showToast('Login realizado com sucesso!', 'success');
      } else {
        // --- LÓGICA DE REGISTRO (SEMPRE COMO CLIENTE) ---
        if (!displayName) {
          showToast('Por favor, preencha seu nome.', 'error');
          setIsLoading(false);
          return;
        }
        
        // A mágica acontece aqui: 'client' está fixo como o tipo de perfil
        await register(email, password, 'client', { displayName });
        showToast('Conta criada com sucesso!', 'success');
      }
      
      onLoginSuccess(); // Sinaliza o sucesso para o componente pai
      onClose(); // Fecha o modal
    } catch (error: any) {
      const message = error.message.includes('auth/email-already-in-use')
        ? 'Este e-mail já está em uso.'
        : 'Falha na autenticação. Verifique suas credenciais.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        // A lógica de registro com Google já cria o usuário como 'client' por padrão no seu AuthContext
        await loginWithGoogle();
        showToast('Login com Google realizado com sucesso!', 'success');
        onLoginSuccess();
        onClose();
    } catch (error) {
        console.error("Google Login Error:", error);
        showToast('Falha no login com Google.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex justify-center mb-6">
          <img src={styloLogo} alt="Stylo" className="h-12" />
        </div>

        {/* Abas de seleção */}
        <div className="flex border-b border-gray-700 mb-6">
            <button onClick={() => setIsLoginView(true)} className={`flex-1 py-2 font-semibold transition-colors ${isLoginView ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-400 hover:text-white'}`}>Entrar</button>
            <button onClick={() => setIsLoginView(false)} className={`flex-1 py-2 font-semibold transition-colors ${!isLoginView ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-400 hover:text-white'}`}>Criar Conta</button>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4">
          {isLoginView ? (
            // --- FORMULÁRIO DE LOGIN ---
            <>
              <div className="relative"><Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full bg-gray-700 p-3 pl-10 rounded-lg border border-transparent focus:border-[#daa520] focus:ring-0" /></div>
              <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required className="w-full bg-gray-700 p-3 pl-10 rounded-lg border border-transparent focus:border-[#daa520] focus:ring-0" /></div>
            </>
          ) : (
            // --- FORMULÁRIO DE REGISTRO (APENAS CLIENTE) ---
            <>
              <div className="relative"><User className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="text" placeholder="Seu Nome Completo" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full bg-gray-700 p-3 pl-10 rounded-lg border border-transparent focus:border-[#daa520] focus:ring-0" /></div>
              <div className="relative"><Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full bg-gray-700 p-3 pl-10 rounded-lg border border-transparent focus:border-[#daa520] focus:ring-0" /></div>
              <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" required className="w-full bg-gray-700 p-3 pl-10 rounded-lg border border-transparent focus:border-[#daa520] focus:ring-0" /></div>
              <p className="text-xs text-gray-500 text-center pt-2">Ao criar a conta, você concorda com nossos Termos de Uso.</p>
            </>
          )}
          
          <button type="submit" disabled={isLoading} className="w-full bg-[#daa520] text-gray-900 font-bold p-3 rounded-lg flex items-center justify-center hover:bg-yellow-500 transition-colors disabled:bg-gray-600">
            {isLoading ? <Loader2 className="animate-spin" /> : (isLoginView ? 'Entrar' : 'Criar Conta de Cliente')}
          </button>
        </form>

        <div className="flex items-center my-6"><hr className="flex-grow border-gray-700" /><span className="mx-4 text-gray-500 text-sm">OU</span><hr className="flex-grow border-gray-700" /></div>
        
        <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-600">
            {/* Adicione o ícone do Google aqui se tiver */}
            Continuar com Google
        </button>
      </div>
    </div>
  );
};

export default LoginModal;