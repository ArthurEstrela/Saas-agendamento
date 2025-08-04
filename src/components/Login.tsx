import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Address } from '../types';

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
    displayName: '',
    establishmentName: '',
    phoneNumber: '',
    cnpj: '',
    segment: '',
    instagram: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Brasil',
  });

  // Novos estados para a lógica do CEP
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro do CEP se o usuário começar a digitar de novo
    if (name === 'postalCode') {
        setCepError('');
    }
  };

  // <-- FUNÇÃO NOVA PARA BUSCAR O CEP -->
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cep.length !== 8) {
      setCepError('CEP deve conter 8 dígitos.');
      return;
    }

    setCepLoading(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado.');
        // Limpa os campos caso o CEP seja inválido
        setFormData(prev => ({
            ...prev,
            street: '',
            neighborhood: '',
            city: '',
            state: '',
        }));
      } else {
        // Preenche os campos com os dados da API
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cepError) {
        alert("Por favor, corrija o CEP antes de continuar.");
        return;
    }
    if (isLoginView) {
      await login(formData.email, formData.password);
    } else {
      const { email, password, userType, street, number, neighborhood, city, state, postalCode, country, ...profileData } = formData;
      const address: Address = { street, number, neighborhood, city, state, postalCode, country };
      await register(email, password, userType, { ...profileData, address });
    }
  };

  const renderAddressFields = () => (
    <>
      <h3 className="text-lg font-semibold text-yellow-400 col-span-full mt-4 border-t border-gray-700 pt-4">Endereço</h3>
      <div className="relative">
        <input
          type="text"
          name="postalCode"
          placeholder="CEP"
          value={formData.postalCode}
          onChange={handleChange}
          onBlur={handleCepBlur} // <-- EVENTO ADICIONADO AQUI
          required
          className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        {cepLoading && <p className="text-xs text-yellow-400 mt-1">Buscando CEP...</p>}
        {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
      </div>
      <div className="relative">
        <input type="text" name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>
      <div className="relative">
        <input type="text" name="number" placeholder="Número" value={formData.number} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>
      <div className="relative">
        <input type="text" name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>
      <div className="relative">
        <input type="text" name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>
      <div className="relative">
        <input type="text" name="state" placeholder="Estado" value={formData.state} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img className=" " src="/src/assets/stylo-logo.png" alt="logo stylo" />
          <p className="text-yellow-400 font-semibold mt-3 text-lg">Seu tempo, seu Stylo.</p>
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

            {!isLoginView && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center justify-center space-x-4">
                    <label className="flex items-center text-gray-300">
                        <input type="radio" name="userType" value="client" checked={formData.userType === 'client'} onChange={handleChange} className="form-radio text-yellow-500"/>
                        <span className="ml-2">Sou Cliente</span>
                    </label>
                    <label className="flex items-center text-gray-300">
                        <input type="radio" name="userType" value="serviceProvider" checked={formData.userType === 'serviceProvider'} onChange={handleChange} className="form-radio text-yellow-500"/>
                        <span className="ml-2">Sou Profissional</span>
                    </label>
                </div>

                {formData.userType === 'client' ? (
                  <>
                    <div className="relative md:col-span-2">
                      <input type="text" name="displayName" placeholder="Seu Nome Completo" value={formData.displayName} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div className="relative md:col-span-2">
                      <input type="tel" name="phoneNumber" placeholder="Número de Celular" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    {renderAddressFields()}
                  </>
                ) : (
                  <>
                    <div className="relative md:col-span-2">
                      <input type="text" name="establishmentName" placeholder="Nome do Estabelecimento" value={formData.establishmentName} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div className="relative md:col-span-2">
                      <input type="tel" name="phoneNumber" placeholder="Número de Celular" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div className="relative">
                      <input type="text" name="cnpj" placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div className="relative">
                      <select name="segment" value={formData.segment} onChange={handleChange} required className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none">
                        <option value="" disabled>Selecione sua área</option>
                        <option value="Barbearia">Barbearia</option>
                        <option value="Salão de Beleza">Salão de Beleza</option>
                        <option value="Manicure/Pedicure">Manicure/Pedicure</option>
                        <option value="Esteticista">Esteticista</option>
                        <option value="Maquiagem">Maquiagem</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    {renderAddressFields()}
                  </>
                )}
              </div>
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