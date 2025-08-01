import React, { useState, useEffect } from 'react';
import { useAuth, storage, db } from '../../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import type { UserProfile, Address } from '../../types';

interface ProfileManagementProps {
  onBack: () => void;
}

const ProfileManagement = ({ onBack }: ProfileManagementProps) => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const { showToast } = useToast();
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [addressData, setAddressData] = useState<Partial<Address>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [slugMessage, setSlugMessage] = useState('');
  
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        establishmentName: userProfile.establishmentName || '',
        segment: userProfile.segment || '',
        cnpj: userProfile.cnpj || '',
        phoneNumber: userProfile.phoneNumber || '',
        instagram: userProfile.instagram || '',
        whatsapp: userProfile.whatsapp || '',
        publicProfileSlug: userProfile.publicProfileSlug || '',
        cancellationPolicyMinutes: userProfile.cancellationPolicyMinutes || 60,
        bookingAdvanceDays: userProfile.bookingAdvanceDays || 30,
      });
      setAddressData(userProfile.address || {});
      setImagePreview(userProfile.photoURL || null);
    }
  }, [userProfile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setProfileData(prev => ({ ...prev, publicProfileSlug: sanitizedValue }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setAddressData(prev => ({ ...prev, postalCode: cep }));

    if (cep.length === 8) {
      setCepLoading(true);
      setCepError('');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        
        const data = await response.json();
        if (data.erro) {
          setCepError('CEP não encontrado.');
          setAddressData(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
        } else {
          setAddressData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (error) {
        setCepError('Erro ao procurar o CEP.');
      } finally {
        setCepLoading(false);
      }
    } else {
      setCepError('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (profileData.publicProfileSlug && profileData.publicProfileSlug !== userProfile.publicProfileSlug) {
      setSlugMessage('A verificar...');
      const q = query(collection(db, "users"), where("publicProfileSlug", "==", profileData.publicProfileSlug));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setSlugMessage("Este nome para o link já está em uso. Por favor, escolha outro.");
        return;
      }
      setSlugMessage('');
    }

    let updatedData = { ...profileData, address: addressData };

    if (imageFile) {
      setIsUploading(true);
      const storageRef = ref(storage, `profile_pictures/${userProfile.uid}/profile`);
      try {
        await uploadBytes(storageRef, imageFile);
        const photoURL = await getDownloadURL(storageRef);
        updatedData.photoURL = photoURL;
      } catch (error) {
        console.error("Erro no upload da imagem:", error);
        showToast("Falha ao enviar a foto.", 'error');
        setIsUploading(false);
        return;
      }
    }
    
    await updateUserProfile(updatedData);
    setIsUploading(false);
    onBack();
  };
  
  const copyToClipboard = () => {
    const baseURL = window.location.origin;
    const publicURL = `${baseURL}/agendar/${profileData.publicProfileSlug || userProfile?.uid}`;
    navigator.clipboard.writeText(publicURL).then(() => {
        showToast("Link copiado para a área de transferência!", 'success');
    }, (err) => {
        console.error('Erro ao copiar o link: ', err);
        showToast("Não foi possível copiar o link.", 'error');
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      <header className="flex items-center mb-10">
        <button onClick={onBack} className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Voltar ao Painel</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <img 
              src={imagePreview || 'https://placehold.co/150x150/1F2937/4B5563?text=Logo'} 
              alt="Logo do Estabelecimento"
              className="h-32 w-32 rounded-full object-cover border-4 border-gray-700"
            />
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Alterar Imagem
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Dados do Estabelecimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="establishmentName" value={profileData.establishmentName || ''} onChange={handleProfileChange} placeholder="Nome do Estabelecimento" className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <select name="segment" value={profileData.segment || ''} onChange={handleProfileChange} className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500">
                <option value="">Selecione a Área de Atuação</option>
                <option value="Barbearia">Barbearia</option>
                <option value="Salão de Beleza">Salão de Beleza</option>
                <option value="Manicure/Pedicure">Manicure/Pedicure</option>
                <option value="Esteticista">Esteticista</option>
                <option value="Maquiagem">Maquilhagem</option>
                <option value="Outro">Outro</option>
              </select>
              <input name="cnpj" value={profileData.cnpj || ''} onChange={handleProfileChange} placeholder="CNPJ (opcional)" className="md:col-span-2 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">A sua Página Pública</h3>
            <div className="flex items-stretch bg-gray-700 rounded-md focus-within:ring-2 focus-within:ring-yellow-500">
                <span className="text-gray-400 p-3 border-r border-gray-600">{window.location.origin}/agendar/</span>
                <input name="publicProfileSlug" value={profileData.publicProfileSlug || ''} onChange={handleSlugChange} placeholder="nome-do-seu-negocio" className="flex-grow bg-transparent p-3 focus:outline-none"/>
            </div>
            {slugMessage && <p className="text-red-500 text-sm mt-2">{slugMessage}</p>}
            <div className="mt-4">
                <button type="button" onClick={copyToClipboard} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                    Copiar Link
                </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="phoneNumber" value={profileData.phoneNumber || ''} onChange={handleProfileChange} placeholder="Telefone Principal" className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="whatsapp" value={profileData.whatsapp || ''} onChange={handleProfileChange} placeholder="WhatsApp para Agendamento" className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="instagram" value={profileData.instagram || ''} onChange={handleProfileChange} placeholder="Instagram (ex: @seu_negocio)" className="md:col-span-2 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 w-full">
                <input name="postalCode" value={addressData.postalCode || ''} onChange={handleCepChange} placeholder="CEP" maxLength={8} className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
                {cepLoading && <p className="text-xs text-yellow-400 mt-1">A procurar...</p>}
                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
              </div>
              <input name="street" value={addressData.street || ''} onChange={handleAddressChange} placeholder="Rua / Avenida" className="md:col-span-2 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="number" value={addressData.number || ''} onChange={handleAddressChange} placeholder="Número" className="md:col-span-1 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="neighborhood" value={addressData.neighborhood || ''} onChange={handleAddressChange} placeholder="Bairro" className="md:col-span-2 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="city" value={addressData.city || ''} onChange={handleAddressChange} placeholder="Cidade" className="md:col-span-2 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              <input name="state" value={addressData.state || ''} onChange={handleAddressChange} placeholder="Estado" className="md:col-span-1 w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Políticas de Agendamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cancelamento grátis até (minutos antes)</label>
                <input type="number" name="cancellationPolicyMinutes" value={profileData.cancellationPolicyMinutes || ''} onChange={handleProfileChange} placeholder="Ex: 120" className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agendamento com antecedência de (dias)</label>
                <input type="number" name="bookingAdvanceDays" value={profileData.bookingAdvanceDays || ''} onChange={handleProfileChange} placeholder="Ex: 30" className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading || isUploading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-500">
              {isUploading ? 'A enviar Imagem...' : loading ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProfileManagement;
