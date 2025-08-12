import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserProfile, Address } from '../../types';
import { Building, Phone, Tag, Instagram, MapPin, Save, Lock, Camera, ArrowLeft, FileText, Search } from 'lucide-react';
import LocationPicker from './LocationPicker'; // Importa o nosso componente de mapa

// --- Funções de Máscara para Validação ---

const formatCEP = (cep: string = '') => {
    return cep
        .replace(/\D/g, '') // Remove tudo o que não é dígito
        .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen depois do 5º dígito
        .substring(0, 9); // Limita a 9 caracteres (99999-999)
};

const formatPhone = (phone: string = '') => {
    return phone
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2') // Coloca parênteses nos dois primeiros dígitos
        .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen depois do 9º dígito (para celulares)
        .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3') // Ajuste para telefones fixos
        .substring(0, 15); // Limita a 15 caracteres ((99) 99999-9999)
};

const formatCNPJ = (cnpj: string = '') => {
    return cnpj
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18); // Limita a 18 caracteres (99.999.999/9999-99)
};


// --- Função Auxiliar de Geocodificação ---
const geocodeAddress = async (address: Partial<Address>): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address.street || !address.city || !address.state) return null;
    const addressString = `${address.street}, ${address.number || ''}, ${address.city}, ${address.state}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Nominatim falhou');
        const data = await response.json();
        if (data && data.length > 0) {
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error("Erro de Geocoding:", error);
        return null;
    }
};


// --- Componente Principal ---
const ProfileManagement = ({ onBack }: { onBack: () => void; }) => {
    const { userProfile, updateUserProfile, uploadImage, changePassword } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [cepError, setCepError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const defaultPosition = { lat: -16.3299, lng: -48.9524 };

    useEffect(() => {
        if (userProfile) {
            const initialAddress = userProfile.address || { street: '', number: '', neighborhood: '', city: '', state: '', postalCode: '', country: 'Brasil' };
            setFormData({
                establishmentName: userProfile.establishmentName || '',
                phoneNumber: formatPhone(userProfile.phoneNumber),
                cnpj: formatCNPJ(userProfile.cnpj),
                segment: userProfile.segment || '',
                instagram: userProfile.instagram || '',
                address: {
                    ...initialAddress,
                    postalCode: formatCEP(initialAddress.postalCode),
                },
            });
            setImagePreview(userProfile.photoURL || null);
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Campos de endereço (exceto CEP)
        if (['street', 'number', 'neighborhood', 'city', 'state'].includes(name)) {
            setFormData(prev => ({ ...prev, address: { ...prev.address!, [name]: value } }));
            return;
        }

        // Aplica máscaras e validações
        switch (name) {
            case 'postalCode':
                setFormData(prev => ({ ...prev, address: { ...prev.address!, postalCode: formatCEP(value) } }));
                if (cepError) setCepError('');
                break;
            case 'phoneNumber':
                setFormData(prev => ({ ...prev, phoneNumber: formatPhone(value) }));
                break;
            case 'cnpj':
                setFormData(prev => ({ ...prev, cnpj: formatCNPJ(value) }));
                break;
            default:
                // Campos normais
                setFormData(prev => ({ ...prev, [name]: value }));
                break;
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
                        postalCode: formatCEP(cep),
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

    const handleGeocodeAndSetMarker = async () => {
        if (!formData.address) {
            showToast("Preencha os campos de endereço primeiro.", "warning");
            return;
        }
        setIsGeocoding(true);
        const coords = await geocodeAddress(formData.address);
        if (coords) {
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address!, latitude: coords.latitude, longitude: coords.longitude } as Address,
            }));
            showToast("Endereço encontrado! Ajuste o pino no mapa se necessário.", "success");
        } else {
            showToast("Endereço não encontrado. Verifique os dados ou ajuste o pino manualmente no mapa.", "error");
        }
        setIsGeocoding(false);
    };

    const handleMapPositionChange = useCallback((newPosition: { lat: number, lng: number }) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address!, latitude: newPosition.lat, longitude: newPosition.lng } as Address,
        }));
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;
        setLoading(true);

        const unmask = (value: string | undefined) => value ? value.replace(/\D/g, '') : '';

        // Prepara os dados para salvar, removendo as máscaras
        const dataToSave: Partial<UserProfile> = {
            ...formData,
            phoneNumber: unmask(formData.phoneNumber),
            cnpj: unmask(formData.cnpj),
            address: {
                ...formData.address!,
                postalCode: unmask(formData.address?.postalCode)
            }
        };

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
            if (dataToSave.address && (!dataToSave.address.latitude || !dataToSave.address.longitude)) {
                const coords = await geocodeAddress(dataToSave.address);
                if (coords) {
                    dataToSave.address.latitude = coords.latitude;
                    dataToSave.address.longitude = coords.longitude;
                } else {
                    showToast("Não foi possível obter a localização exata. O perfil será salvo sem ela.", "warning");
                }
            }
            await updateUserProfile({ ...dataToSave, photoURL: finalPhotoURL });
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

    const mapPosition = {
        lat: formData.address?.latitude || defaultPosition.lat,
        lng: formData.address?.longitude || defaultPosition.lng,
    };

    return (
        <div className="animate-fade-in-down">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-[#daa520] mb-6 transition-colors">
                <ArrowLeft size={18} />
                Voltar ao Dashboard
            </button>
            <h2 className="text-3xl font-bold text-white mb-8">Perfil do Estabelecimento</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna da Esquerda: Foto e Senha */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-black/30 p-6 rounded-xl border border-gray-800 text-center">
                        <div className="relative w-32 h-32 mx-auto group">
                            <img 
                                src={imagePreview || `https://placehold.co/150x150/111827/daa520?text=${userProfile?.establishmentName?.charAt(0) || '?'}`} 
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
                        <h3 className="text-xl font-bold text-white mt-4">{userProfile?.establishmentName}</h3>
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
                            <h3 className="text-lg font-bold text-white mb-4">Informações do Negócio</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative sm:col-span-2"><Building className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="establishmentName" value={formData.establishmentName || ''} onChange={handleChange} placeholder="Nome do Estabelecimento" required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                                <div className="relative"><Phone className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} placeholder="Telefone de Contato" className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                                <div className="relative"><FileText className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} placeholder="CNPJ" className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                                <div className="relative sm:col-span-2"><Tag className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><select name="segment" value={formData.segment || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700 appearance-none"><option value="" disabled>Selecione sua área</option><option>Barbearia</option><option>Salão de Beleza</option><option>Manicure/Pedicure</option><option>Esteticista</option><option>Maquiagem</option><option>Outro</option></select></div>
                                <div className="relative sm:col-span-2"><Instagram className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="instagram" value={formData.instagram || ''} onChange={handleChange} placeholder="Usuário do Instagram (ex: @stylo)" className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" /></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 pt-6 border-t border-gray-800">Endereço e Localização Exata</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative sm:col-span-2"><MapPin className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" /><input type="text" name="postalCode" placeholder="CEP" value={formData.address?.postalCode || ''} onChange={handleChange} onBlur={handleCepBlur} required className="w-full bg-gray-800 p-3 pl-10 rounded-md border border-gray-700" />{cepLoading && <p className="text-xs text-yellow-400 mt-1">Buscando...</p>}{cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}</div>
                                <div className="sm:col-span-2"><input type="text" name="street" placeholder="Rua / Avenida" value={formData.address?.street || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="number" placeholder="Número" value={formData.address?.number || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="neighborhood" placeholder="Bairro" value={formData.address?.neighborhood || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="city" placeholder="Cidade" value={formData.address?.city || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                                <div><input type="text" name="state" placeholder="Estado" value={formData.address?.state || ''} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-md border border-gray-700" /></div>
                            </div>
                            <div className="mt-4">
                                <button type="button" onClick={handleGeocodeAndSetMarker} disabled={isGeocoding || cepLoading} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                                    <Search size={16}/>
                                    {isGeocoding ? 'A procurar...' : 'Procurar endereço no mapa'}
                                </button>
                                <p className="text-sm text-gray-400 mt-2">Após procurar, arraste o pino para a localização exata da entrada do seu estabelecimento.</p>
                                <LocationPicker position={mapPosition} onPositionChange={handleMapPositionChange} />
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

export default ProfileManagement;
