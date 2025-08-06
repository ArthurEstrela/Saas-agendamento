import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserProfile } from '../../types';
import { User, Mail, Phone, MapPin, Save, Lock, Camera, ArrowLeft } from 'lucide-react';

// --- Componente Principal ---
const ClientProfileManagement = ({ onBack }: { onBack: () => void; }) => {
    const { userProfile, updateUserProfile, uploadImage, changePassword } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                phoneNumber: userProfile.phoneNumber || '',
                address: userProfile.address || { street: '', number: '', neighborhood: '', city: '', state: '', postalCode: '', country: 'Brasil' },
            });
            setImagePreview(userProfile.photoURL || null);
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (['street', 'number', 'neighborhood', 'city', 'state', 'postalCode'].includes(name)) {
            setFormData(prev => ({ ...prev, address: { ...prev.address!, [name]: value } }));
            if (name === 'postalCode') setCepError('');
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            if (cep.length > 0) setCepError('CEP inválido. Deve conter 8 dígitos.');
            return;
        }
        setCepLoading(true);
        setCepError('');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) {
                setCepError('CEP não encontrado.');
            } else {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address!,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                    }
                }));
                showToast('Endereço preenchido automaticamente!', 'success');
            }
        } catch (error) {
            setCepError('Erro ao buscar CEP. Tente novamente.');
        } finally {
            setCepLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;
        setLoading(true);

        let finalPhotoURL = userProfile.photoURL;
        if (imageFile) {
            try {
                const uploadPath = `profile_pictures/${userProfile.uid}/${imageFile.name}`;
                finalPhotoURL = await uploadImage(imageFile, uploadPath);
            } catch (error) {
                showToast('Erro ao fazer upload da imagem.', 'error');
                setLoading(false);
                return;
            }
        }

        try {
            await updateUserProfile({ ...formData, photoURL: finalPhotoURL });
        } finally {
            setLoading(false);
        }
    };
    
    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('As novas senhas não coincidem.', 'error');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }
        setLoading(true);
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-down">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-[#daa520] mb-6 transition-colors">
                <ArrowLeft size={18} />
                Voltar ao Dashboard
            </button>
            <h2 className="text-3xl font-bold text-white mb-8">Meu Perfil</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna da Esquerda: Foto e Senha */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-black/30 p-6 rounded-xl border border-gray-800 text-center">
                        <div className="relative w-32 h-32 mx-auto group">
                            <img 
                                src={imagePreview || `https://placehold.co/150x150/111827/daa520?text=${userProfile?.displayName?.charAt(0) || '?'}`} 
                                alt="Foto de Perfil"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-700 group-hover:border-[#daa520] transition-all"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera size={32} className="text-white"/>
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                        </div>
                        <h3 className="text-xl font-bold text-white mt-4">{userProfile?.displayName}</h3>
                        <p className="text-sm text-gray-400">{userProfile?.email}</p>
                    </div>

                    <div className="bg-black/30 p-6 rounded-xl border border-gray-800">
                         <h3 className="text-lg font-bold text-white mb-4">Alterar Senha</h3>
                         <form onSubmit={handleSavePassword} className="space-y-4">
                            <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Senha Atual" required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                            <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Nova Senha" required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                            <div className="relative"><Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Confirmar Nova Senha" required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                            <button type="submit" disabled={loading} className="w-full bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-500">
                                {loading ? 'A guardar...' : 'Guardar Nova Senha'}
                            </button>
                         </form>
                    </div>
                </div>

                {/* Coluna da Direita: Dados */}
                <div className="lg:col-span-2 bg-black/30 p-6 rounded-xl border border-gray-800">
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Informações Pessoais</h3>
                            <div className="space-y-4">
                                <div className="relative"><User className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="displayName" value={formData.displayName || ''} onChange={handleChange} placeholder="Nome Completo" required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                                <div className="relative"><Phone className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} placeholder="Número de Celular" className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 pt-6 border-t border-gray-800">Endereço</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative sm:col-span-2"><MapPin className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="postalCode" placeholder="CEP" value={formData.address?.postalCode || ''} onChange={handleChange} onBlur={handleCepBlur} required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" />{cepLoading && <p className="text-xs text-yellow-400 mt-1">Buscando...</p>}{cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}</div>
                                <div className="sm:col-span-2"><input type="text" name="street" placeholder="Rua / Avenida" value={formData.address?.street || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="number" placeholder="Número" value={formData.address?.number || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="neighborhood" placeholder="Bairro" value={formData.address?.neighborhood || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="city" placeholder="Cidade" value={formData.address?.city || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="state" placeholder="Estado" value={formData.address?.state || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-800">
                             <button type="submit" disabled={loading} className="w-full bg-[#daa520] text-black font-bold py-3 rounded-lg hover:bg-[#c8961e] transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">
                                <Save size={18}/>
                                {loading ? 'A guardar...' : 'Guardar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClientProfileManagement;
