import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

const ProfileManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  
  // Estado principal com os dados a serem salvos
  const [profileData, setProfileData] = useState({
    establishmentName: '',
    address: '',
    instagram: '',
    whatsapp: '',
    cancellationPolicyMinutes: 120, // Padrão de 2 horas (120 min)
    bookingAdvanceDays: 30, // Valor padrão de 30 dias
  });

  // Estado auxiliar para os inputs de horas e minutos da UI
  const [policyTime, setPolicyTime] = useState({ hours: 2, minutes: 0 });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Efeito para popular os campos quando o perfil carrega
  useEffect(() => {
    if (userProfile) {
      const totalMinutes = userProfile.cancellationPolicyMinutes || 120;
      setProfileData({
        establishmentName: userProfile.establishmentName || '',
        address: userProfile.address || '',
        instagram: userProfile.instagram || '',
        whatsapp: userProfile.whatsapp || '',
        cancellationPolicyMinutes: totalMinutes,
        bookingAdvanceDays: userProfile.bookingAdvanceDays || 30,
      });

      // Calcula horas e minutos para mostrar na UI
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setPolicyTime({ hours, minutes });

      setPreviewImage(userProfile.photoURL || null);
    }
  }, [userProfile]);

  // Atualiza o estado principal quando os outros campos mudam
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Converte para número se for a política de agendamento
    const finalValue = name === 'bookingAdvanceDays' ? Number(value) : value;
    setProfileData(prev => ({ ...prev, [name]: finalValue }));
  };

  // Atualiza o estado da política de cancelamento quando horas/minutos mudam
  const handlePolicyTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newTime = { ...policyTime, [name]: Number(value) || 0 };
    setPolicyTime(newTime);
    // Converte horas e minutos para o total de minutos e atualiza o estado principal
    setProfileData(prev => ({
      ...prev,
      cancellationPolicyMinutes: (newTime.hours * 60) + newTime.minutes,
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
        console.error("Erro ao fazer upload da imagem:", error);
        setIsUploading(false);
        alert("Houve um erro ao enviar sua foto. Tente novamente.");
        return;
      }
    }

    await updateUserProfile(dataToUpdate);
    
    setIsUploading(false);
    alert("Perfil atualizado com sucesso!");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil e Regras</h2>
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

        <div className="border-t border-gray-600 pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Prazo para cancelamento
            </label>
            <p className="text-xs text-gray-400 mb-2">O cliente só poderá cancelar antes desse prazo.</p>
            <div className="flex items-center gap-4">
                <div>
                    <label htmlFor="hours" className="block text-xs text-gray-400">Horas</label>
                    <input 
                        type="number" 
                        name="hours" 
                        id="hours" 
                        value={policyTime.hours} 
                        onChange={handlePolicyTimeChange} 
                        min="0"
                        className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" 
                    />
                </div>
                <div>
                    <label htmlFor="minutes" className="block text-xs text-gray-400">Minutos</label>
                    <input 
                        type="number" 
                        name="minutes" 
                        id="minutes" 
                        value={policyTime.minutes} 
                        onChange={handlePolicyTimeChange} 
                        min="0"
                        max="59"
                        step="5"
                        className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" 
                    />
                </div>
            </div>
        </div>
        
        {/* CAMPO NOVO PARA A REGRA DE AGENDAMENTO */}
        <div className="border-t border-gray-600 pt-6">
            <label htmlFor="bookingAdvanceDays" className="block text-sm font-medium text-gray-300 mb-1">
                Antecedência máxima para agendamento (em dias)
            </label>
            <p className="text-xs text-gray-400 mb-2">O cliente só poderá agendar com até X dias de antecedência. (Ex: 30 = agenda aberta para os próximos 30 dias)</p>
            <input 
                type="number" 
                name="bookingAdvanceDays" 
                id="bookingAdvanceDays" 
                value={profileData.bookingAdvanceDays} 
                onChange={handleChange} 
                min="1"
                className="w-full md:w-1/2 bg-gray-700 text-white border-gray-600 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500" 
            />
        </div>
        
        <button type="submit" disabled={loading || isUploading} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
          {isUploading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
};

export default ProfileManagement;
