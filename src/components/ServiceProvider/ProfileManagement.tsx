import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

const ProfileManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [profileData, setProfileData] = useState({
    establishmentName: '',
    address: '',
    instagram: '',
    whatsapp: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        establishmentName: userProfile.establishmentName || '',
        address: userProfile.address || '',
        instagram: userProfile.instagram || '',
        whatsapp: userProfile.whatsapp || '',
      });
      setPreviewImage(userProfile.photoURL || null);
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
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
    
    // Cria um objeto para armazenar apenas os dados que serão atualizados.
    const dataToUpdate: { [key: string]: any } = { ...profileData };

    // Apenas se uma NOVA imagem for selecionada, faz o upload e adiciona a URL aos dados.
    if (profileImage) {
      const storageRef = ref(storage, `profile_pictures/${userProfile.uid}`);
      try {
        const snapshot = await uploadBytes(storageRef, profileImage);
        // Adiciona a nova photoURL ao objeto de atualização.
        dataToUpdate.photoURL = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        setIsUploading(false);
        alert("Houve um erro ao enviar sua foto. Tente novamente.");
        return;
      }
    }

    // Envia apenas os dados que foram modificados (ou a nova URL da foto).
    // Se nenhuma foto foi enviada, o campo 'photoURL' não é incluído, evitando o erro de 'undefined'.
    await updateUserProfile(dataToUpdate);
    
    setIsUploading(false);
    alert("Perfil atualizado com sucesso!");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="shrink-0">
            <img 
              className="h-24 w-24 object-cover rounded-full" 
              src={previewImage || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
              alt="Foto do perfil" 
            />
          </div>
          <label className="block">
            <span className="sr-only">Escolha a foto do perfil</span>
            <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-yellow-900 hover:file:bg-yellow-400"/>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="establishmentName" className="block text-sm font-medium text-gray-300 mb-1">Nome do Estabelecimento</label>
                <input type="text" name="establishmentName" id="establishmentName" value={profileData.establishmentName} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input type="text" name="address" id="address" value={profileData.address} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
             <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300 mb-1">WhatsApp (com DDD)</label>
                <input type="tel" name="whatsapp" id="whatsapp" value={profileData.whatsapp} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-1">Instagram (somente o @usuario)</label>
                <input type="text" name="instagram" id="instagram" value={profileData.instagram} onChange={handleChange} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
        </div>
        
        <button type="submit" disabled={loading || isUploading} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
          {isUploading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
};

export default ProfileManagement;
