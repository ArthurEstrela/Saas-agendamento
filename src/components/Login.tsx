import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Componente de Ícone para reutilização
const InputIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    {children}
  </div>
);

const Login = () => {
  const { login, register, loginWithGoogle, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  // Estado unificado para o formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'client' as 'client' | 'serviceProvider',
    displayName: '', // Nome do cliente
    establishmentName: '', // Nome do estabelecimento
    phoneNumber: '',
    cnpj: '',
    segment: '', // Área de atuação
    instagram: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      await login(formData.email, formData.password);
    } else {
      const { email, password, userType, ...profileData } = formData;
      await register(email, password, userType, profileData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500">Stylo</h1>
          <p className="text-gray-400 mt-2">Sua agenda de beleza na palma da mão</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setIsLoginView(true)}
              className={`w-1/2 py-3 text-center font-semibold transition-colors duration-300 ${isLoginView ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-yellow-400'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`w-1/2 py-3 text-center font-semibold transition-colors duration-300 ${!isLoginView ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-yellow-400'}`}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos Comuns */}
            <div className="relative">
              <InputIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              </InputIcon>
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
            </div>
            <div className="relative">
              <InputIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L4.257 19.743A1 1 0 112.84 18.33l6.09-6.09A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>
              </InputIcon>
              <input type="password" name="password" placeholder="Senha" value={formData.password} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
            </div>

            {/* Campos de Registro */}
            {!isLoginView && (
              <>
                <div className="flex items-center justify-center space-x-4">
                    <label className="flex items-center text-gray-300">
                        <input type="radio" name="userType" value="client" checked={formData.userType === 'client'} onChange={handleChange} className="form-radio text-yellow-500"/>
                        <span className="ml-2">Sou Cliente</span>
                    </label>
                    <label className="flex items-center text-gray-300">
                        <input type="radio" name="userType" value="serviceProvider" checked={formData.userType === 'serviceProvider'} onChange={handleChange} className="form-radio text-yellow-500"/>
                        <span className="ml-2">Sou Profissional</span>
                    </label>
                </div>

                {/* Campos para Cliente */}
                {formData.userType === 'client' && (
                  <>
                    <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></InputIcon>
                      <input type="text" name="displayName" placeholder="Seu Nome Completo" value={formData.displayName} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                    <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></InputIcon>
                      <input type="tel" name="phoneNumber" placeholder="Número de Celular" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                  </>
                )}

                {/* Campos para Prestador de Serviço */}
                {formData.userType === 'serviceProvider' && (
                  <>
                    <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></InputIcon>
                      <input type="text" name="establishmentName" placeholder="Nome do Estabelecimento" value={formData.establishmentName} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                     <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></InputIcon>
                      <input type="tel" name="phoneNumber" placeholder="Número de Celular" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                    <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2H4v8h12V6z" clipRule="evenodd" /></svg></InputIcon>
                      <input type="text" name="cnpj" placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                    <div className="relative">
                       <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a1 1 0 011-1h14a1 1 0 011 1v4.293zM5 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg></InputIcon>
                      <select name="segment" value={formData.segment} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all appearance-none">
                        <option value="" disabled>Selecione sua área de atuação</option>
                        <option value="Barbearia">Barbearia</option>
                        <option value="Salão de Beleza">Salão de Beleza</option>
                        <option value="Manicure/Pedicure">Manicure/Pedicure</option>
                        <option value="Esteticista">Esteticista</option>
                        <option value="Maquiagem">Maquiagem</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="relative">
                      <InputIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.237 2.635 7.855 6.358 9.252-.084-.363-.108-.734-.108-1.122 0-.933.22-1.78.6-2.5.38-1.13 1.25-2.82 1.25-2.82s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.545 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.58-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.472-2.175 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.909.444 2.908.444 5.523 0 10-4.477 10-10S15.523 0 10 0z" clipRule="evenodd" /></svg></InputIcon>
                      <input type="text" name="instagram" placeholder="Link do Instagram (opcional)" value={formData.instagram} onChange={handleChange} className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                    </div>
                  </>
                )}
              </>
            )}

            <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 transform hover:scale-105 disabled:bg-gray-500">
              {loading ? 'Processando...' : isLoginView ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-500">OU</span>
            </div>
          </div>

          <button onClick={loginWithGoogle} disabled={loading} className="w-full flex items-center justify-center bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300 disabled:bg-gray-300">
             <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;