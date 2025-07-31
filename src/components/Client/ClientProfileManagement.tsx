import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Address } from '../../types';

const storage = getStorage();

interface ClientProfileManagementProps {
  onBack: () => void;
}

const ClientProfileManagement = ({ onBack }: ClientProfileManagementProps) => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Brasil',
    } as Address,
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || profileData.address,
      });
      setPreviewImage(userProfile.photoURL || null);
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
        ...prev,
        address: {
            ...prev.address,
            [name]: value,
        }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsUploading(true);
    
    const dataToUpdate: { [key: string]: any } = { ...profileData };

    if (profileImage) {
      const storageRef = ref(storage, `profile_pictures/${userProfile.uid}`);
      try {
        const snapshot = await uploadBytes(storageRef, profileImage);
        dataToUpdate.photoURL = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Erro no upload da imagem:", error);
        setIsUploading(false);
        alert("Houve um erro ao enviar sua foto.");
        return;
      }
    }

    await updateUserProfile(dataToUpdate);
    
    setIsUploading(false);
    alert("Perfil atualizado com sucesso!");
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
        <header className="flex items-center mb-10">
            <button onClick={onBack} className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>Voltar ao Painel</span>
            </button>
        </header>
        <main className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Editar Meu Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                <div className="flex items-center space-x-6">
                    <img className="h-24 w-24 object-cover rounded-full" src={previewImage || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} alt="Sua foto"/>
                    <label className="block">
                        <span className="sr-only">Escolha a foto do perfil</span>
                        <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-yellow-900 hover:file:bg-yellow-400"/>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
                        <input type="text" name="displayName" id="displayName" value={profileData.displayName} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">Celular</label>
                        <input type="tel" name="phoneNumber" id="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                </div>

                <div className="border-t border-gray-600 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <h3 className="text-lg font-semibold text-yellow-400 col-span-full">Meu Endereço</h3>
                    <div className="md:col-span-2">
                        <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-1">Rua / Avenida</label>
                        <input type="text" name="street" id="street" value={profileData.address.street} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                        <label htmlFor="number" className="block text-sm font-medium text-gray-300 mb-1">Número</label>
                        <input type="text" name="number" id="number" value={profileData.address.number} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                        <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-300 mb-1">Bairro</label>
                        <input type="text" name="neighborhood" id="neighborhood" value={profileData.address.neighborhood} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-1">CEP</label>
                        <input type="text" name="postalCode" id="postalCode" value={profileData.address.postalCode} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                        <input type="text" name="city" id="city" value={profileData.address.city} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                        <input type="text" name="state" id="state" value={profileData.address.state} onChange={handleAddressChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                </div>
                
                <button type="submit" disabled={loading || isUploading} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
                    {isUploading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </main>
    </div>
  );
};

export default ClientProfileManagement;
