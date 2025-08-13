import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { Address } from '../types';
import logo from '../assets/stylo-logo.png';
import { Mail, Lock, User, Briefcase, ArrowLeft, Building, Phone, FileText, MapPin } from 'lucide-react';

// --- Componente de Card para Seleção de Tipo de Usuário ---
const UserTypeCard = ({ icon: Icon, title, description, onClick, isSelected }) => (
    <div
        onClick={onClick}
        className={`relative p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-2 ${isSelected ? 'border-[#daa520] bg-black shadow-2xl shadow-[#daa520]/20' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'}`}
    >
        <div className="flex flex-col items-center text-center">
            <Icon className={`h-12 w-12 mb-4 transition-colors duration-300 ${isSelected ? 'text-[#daa520]' : 'text-gray-500'}`} />
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
        {isSelected && <div className="absolute top-4 right-4 h-5 w-5 bg-[#daa520] rounded-full border-2 border-black" />}
    </div>
);

// --- Componente Principal de Login/Registro ---
const Login = () => {
    const { login, register, loginWithGoogle, loading } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userType: null as 'client' | 'serviceProvider' | null,
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
    
    const [error, setError] = useState('');
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [cnpjError, setCnpjError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('type') === 'register') {
            setIsLoginView(false);
        }
    }, [location.search]);
    
    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return cleaned;
    };

    const formatCnpj = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
        if (match) {
            return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
        }
        return cleaned;
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;
        let currentError = '';

        if (name === 'phoneNumber') {
            finalValue = value.replace(/\D/g, '');
            if (finalValue.length > 11) {
                finalValue = finalValue.slice(0, 11);
            }
            if (finalValue.length > 0 && finalValue.length < 10) {
                currentError = 'Número de telefone deve ter 10 ou 11 dígitos.';
            }
            setPhoneError(currentError);
        }

        if (name === 'cnpj') {
            finalValue = value.replace(/\D/g, '');
            if (finalValue.length > 14) {
                finalValue = finalValue.slice(0, 14);
            }
            if (finalValue.length > 0 && finalValue.length < 14) {
                currentError = 'CNPJ deve ter 14 dígitos.';
            }
            setCnpjError(currentError);
        }
        
        if (name === 'postalCode') {
            finalValue = value.replace(/\D/g, '');
            if (finalValue.length > 8) {
                finalValue = finalValue.slice(0, 8);
            }
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            if (cep.length > 0) setCepError('CEP inválido. Deve conter 8 dígitos.');
            setFormData(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
            return;
        }
        setCepLoading(true);
        setCepError('');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) {
                setCepError('CEP não encontrado.');
                setFormData(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
            } else {
                setFormData(prev => ({ ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
            }
        } catch (error) {
            setCepError('Erro ao buscar CEP. Tente novamente.');
        } finally {
            setCepLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (isLoginView) {
            try {
                await login(formData.email, formData.password);
                navigate('/dashboard');
            } catch (err) {
                setError('Email ou senha inválidos.');
            }
        } else {
            if (!formData.userType) {
                setError('Por favor, selecione um tipo de conta.');
                return;
            }
            if (cepError || phoneError || cnpjError) {
                setError("Por favor, corrija os erros nos campos antes de continuar.");
                return;
            }
            try {
                const { email, password, userType, street, number, neighborhood, city, state, postalCode, country, ...profileData } = formData;
                const address: Address = { street, number, neighborhood, city, state, postalCode, country };
                await register(email, password, userType, { ...profileData, address });
                navigate('/dashboard');
            } catch (err) {
                setError('Falha ao criar a conta. Verifique os seus dados.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setError('Falha ao fazer login com o Google.');
        }
    };
    
    const resetForm = () => {
        setFormData({
            email: '', password: '', userType: null, displayName: '', establishmentName: '',
            phoneNumber: '', cnpj: '', segment: '', instagram: '', street: '', number: '',
            neighborhood: '', city: '', state: '', postalCode: '', country: 'Brasil',
        });
        setError('');
        setCepError('');
        setPhoneError('');
        setCnpjError('');
    };

    const renderRegisterView = () => {
        if (!formData.userType) {
            return (
                <div className="animate-fade-in-down">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white">Primeiro, quem é você?</h2>
                        <p className="text-gray-400 mt-2">Escolha o tipo de conta que melhor descreve você.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UserTypeCard icon={User} title="Sou Cliente" description="Quero encontrar e agendar serviços com os melhores profissionais." isSelected={formData.userType === 'client'} onClick={() => setFormData(prev => ({...prev, userType: 'client'}))} />
                        <UserTypeCard icon={Briefcase} title="Sou Profissional" description="Quero gerenciar minha agenda, serviços e clientes na plataforma." isSelected={formData.userType === 'serviceProvider'} onClick={() => setFormData(prev => ({...prev, userType: 'serviceProvider'}))} />
                    </div>
                </div>
            );
        }

        return (
            <div className="animate-fade-in-up">
                <button onClick={() => setFormData(prev => ({...prev, userType: null}))} className="flex items-center text-sm text-gray-400 hover:text-[#daa520] mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para seleção
                </button>
                <h2 className="text-3xl font-bold text-white text-center mb-2">Crie a sua conta de {formData.userType === 'client' ? 'Cliente' : 'Profissional'}</h2>
                <p className="text-gray-400 text-center mb-8">Vamos começar!</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative"><User className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="text" name="displayName" placeholder="Seu Nome Completo" value={formData.displayName} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
                    <div className="relative"><Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
                    <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="password" name="password" placeholder="Senha" value={formData.password} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
                    
                    {formData.userType === 'serviceProvider' && (
                        <>
                            <div className="relative"><Building className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="text" name="establishmentName" placeholder="Nome do Estabelecimento" value={formData.establishmentName} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10" /></div>
                            <div className="relative">
                                <Phone className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    placeholder="Número de Celular"
                                    value={formatPhoneNumber(formData.phoneNumber)}
                                    onChange={handleChange}
                                    pattern="\(\d{2}\) \d{5}-\d{4}"
                                    title="Formato: (XX) XXXXX-XXXX"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]"
                                />
                                {phoneError && <p className="text-red-500 text-xs mt-1 absolute bottom-[-20px] left-0">{phoneError}</p>}
                            </div>
                            <div className="relative">
                                <FileText className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <input
                                    type="tel"
                                    name="cnpj"
                                    placeholder="CNPJ"
                                    value={formatCnpj(formData.cnpj)}
                                    onChange={handleChange}
                                    pattern="\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}"
                                    title="Formato: XX.XXX.XXX/XXXX-XX"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]"
                                />
                                {cnpjError && <p className="text-red-500 text-xs mt-1 absolute bottom-[-20px] left-0">{cnpjError}</p>}
                            </div>
                            <div className="relative"><select name="segment" value={formData.segment} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-4 appearance-none focus:ring-2 focus:ring-[#daa520]"><option value="" disabled>Selecione sua área</option><option>Barbearia</option><option>Salão de Beleza</option><option>Manicure/Pedicure</option><option>Esteticista</option><option>Maquiagem</option><option>Outro</option></select></div>
                        </>
                    )}
                    
                    <h3 className="text-lg font-semibold text-[#daa520] col-span-full pt-4 border-t border-gray-700">Endereço</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative sm:col-span-2">
                            <MapPin className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                            <input
                                type="tel"
                                name="postalCode"
                                placeholder="CEP"
                                value={formData.postalCode}
                                onChange={handleChange}
                                onBlur={handleCepBlur}
                                pattern="\d{8}"
                                title="CEP deve conter 8 dígitos"
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]"
                            />
                            {cepLoading && <p className="text-xs text-yellow-400 mt-1">Buscando...</p>}
                            {cepError && <p className="text-red-500 text-xs mt-1">{cepError}</p>}
                        </div>
                        <div className="relative sm:col-span-2"><input type="text" name="street" placeholder="Rua / Avenida" value={formData.street} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" /></div>
                        <div><input type="text" name="number" placeholder="Número" value={formData.number} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" /></div>
                        <div><input type="text" name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" /></div>
                        <div><input type="text" name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" /></div>
                        <div><input type="text" name="state" placeholder="Estado" value={formData.state} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" /></div>
                    </div>

                    <button type="submit" disabled={loading || !!cepError || !!phoneError || !!cnpjError} className="w-full bg-[#daa520] text-black font-bold py-3 rounded-lg hover:bg-[#c8961e] transition-colors disabled:bg-gray-600">
                        {loading ? 'Processando...' : 'Criar Conta'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4">
            {/* Botão de Voltar movido e estilizado */}
            <Link 
                to="/" 
                className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-700/80 hover:text-[#daa520] transition-all duration-300"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
            </Link>

            <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-8">
                    <Link to="/"><img className="w-32 mx-auto" src={logo} alt="Stylo Logo" /></Link>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
                    {isLoginView ? (
                        <div className="animate-fade-in-down">
                            <h2 className="text-3xl font-bold text-white text-center mb-8">Bem-vindo de volta!</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div><label className="text-sm font-bold text-gray-400 block mb-2">Email</label><div className="relative"><Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div></div>
                                <div><label className="text-sm font-bold text-gray-400 block mb-2">Senha</label><div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" /><input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div></div>
                                <button type="submit" disabled={loading} className="w-full bg-[#daa520] text-black font-bold py-3 rounded-lg hover:bg-[#c8961e] transition-colors disabled:bg-gray-600">{loading ? 'Entrando...' : 'Entrar'}</button>
                            </form>
                        </div>
                    ) : (
                        renderRegisterView()
                    )}
                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                    <div className="flex items-center my-6"><hr className="flex-grow border-gray-700" /><span className="mx-4 text-gray-500 text-sm">OU</span><hr className="flex-grow border-gray-700" /></div>
                    <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-gray-800 border border-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-600">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.641-3.657-11.303-8.591l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.686 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        Continuar com Google
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-8">
                        {isLoginView ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button onClick={() => { setIsLoginView(!isLoginView); resetForm(); }} className="font-bold text-[#daa520] hover:underline ml-2">
                            {isLoginView ? 'Crie uma agora' : 'Faça login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
