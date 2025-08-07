import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Save, XCircle, Loader2 } from 'lucide-react';
import type { UserProfile, Address } from '../../types';
import { useToast } from '../../context/ToastContext';
import LoginPrompt from '../Common/LoginPrompt'; // Importa o novo LoginPrompt

interface ClientProfileManagementProps {
  onBack: () => void;
  LoginPrompt: React.ComponentType<{ message: string; onAction: () => void }>; // Recebe LoginPrompt
  handleLoginAction: () => void; // Recebe handleLoginAction
}

const ClientProfileManagement: React.FC<ClientProfileManagementProps> = ({ onBack, LoginPrompt, handleLoginAction }) => {
  const { currentUser, userProfile, updateUserProfile, uploadImage } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser && userProfile) {
        setFormData({
          displayName: userProfile.displayName || '',
          phoneNumber: userProfile.phoneNumber || '',
          photoURL: userProfile.photoURL || '',
          address: userProfile.address || {
            street: '', number: '', neighborhood: '', city: '', state: '', postalCode: '', country: ''
          },
        });
        setPhotoPreview(userProfile.photoURL || null);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [currentUser, userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1] as keyof Address;
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address as Address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photoURL: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Você precisa estar logado para atualizar seu perfil.", 'error');
      return;
    }

    setIsSaving(true);
    let newPhotoURL = formData.photoURL;

    try {
      if (photoFile) {
        const path = `profile_pictures/${currentUser.uid}/${photoFile.name}`;
        newPhotoURL = await uploadImage(photoFile, path);
      }

      await updateUserProfile({ ...formData, photoURL: newPhotoURL });
      showToast("Perfil atualizado com sucesso!", 'success');
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      showToast("Erro ao salvar perfil.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 py-10">A carregar perfil...</p>;
  }

  if (!currentUser) {
    return <LoginPrompt message="Edite aqui o seu perfil." onAction={handleLoginAction} />;
  }

  return (
    <div className="animate-fade-in-down">
      <h2 className="text-3xl font-bold text-white mb-6">Meu Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção de Foto de Perfil */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 shadow-lg group">
            <img
              src={photoPreview || 'https://placehold.co/150x150/111827/4B5563?text=Foto'}
              alt="Foto de Perfil"
              className="w-full h-full object-cover"
            />
            <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
              <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          {photoPreview && (
            <button type="button" onClick={handleRemovePhoto} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm">
              <XCircle size={16} /> Remover Foto
            </button>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input type="text" id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" id="email" name="email" value={currentUser?.email || ''} disabled className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
        </div>

        {/* Endereço */}
        <h3 className="text-xl font-bold text-white mt-8 mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.street" className="block text-sm font-medium text-gray-300 mb-1">Rua</label>
            <input type="text" id="address.street" name="address.street" value={formData.address?.street || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="address.number" className="block text-sm font-medium text-gray-300 mb-1">Número</label>
            <input type="text" id="address.number" name="address.number" value={formData.address?.number || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="address.neighborhood" className="block text-sm font-medium text-gray-300 mb-1">Bairro</label>
            <input type="text" id="address.neighborhood" name="address.neighborhood" value={formData.address?.neighborhood || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
            <input type="text" id="address.city" name="address.city" value={formData.address?.city || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
            <input type="text" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div>
            <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-300 mb-1">CEP</label>
            <input type="text" id="address.postalCode" name="address.postalCode" value={formData.address?.postalCode || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address.country" className="block text-sm font-medium text-gray-300 mb-1">País</label>
            <input type="text" id="address.country" name="address.country" value={formData.address?.country || ''} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-md border border-gray-700 focus:ring-2 focus:ring-[#daa520]" />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
            {isSaving ? 'A Guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientProfileManagement;
