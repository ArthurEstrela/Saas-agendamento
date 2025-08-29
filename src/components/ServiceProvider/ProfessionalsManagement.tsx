import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import type { Professional } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Edit, Trash2, User, X, UploadCloud, AlertTriangle, Loader2 } from 'lucide-react';

// --- TIPOS E INTERFACES ---
type ModalMode = 'add' | 'edit' | 'delete';

interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  professional?: Professional;
}

interface ProfessionalFormData {
  name: string;
}

// --- COMPONENTE DO MODAL (MAIS INTELIGENTE) ---
const ProfessionalModal = ({
  state,
  onClose,
  onSave,
  onDelete,
  isLoading,
}: {
  state: ModalState;
  onClose: () => void;
  onSave: (data: Professional, imageFile: File | null) => void;
  onDelete: (professionalId: string) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<ProfessionalFormData>({ name: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para resetar o formulário quando o modal abre ou muda de profissional
  useEffect(() => {
    if (state.isOpen) {
      const p = state.professional;
      setFormData({ name: p?.name || '' });
      setImagePreview(p?.photoURL || null);
      setImageFile(null); // Sempre reseta o arquivo ao abrir
    }
  }, [state]);

  if (!state.isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return; // Validação simples

    const professionalData: Professional = {
      id: state.mode === 'edit' && state.professional ? state.professional.id : uuidv4(),
      name: formData.name,
      photoURL: state.professional?.photoURL || '', // A URL final será atualizada na função de save
      services: state.professional?.services || [],
      availability: state.professional?.availability || {},
    };
    onSave(professionalData, imageFile);
  };

  // Renderiza o conteúdo do modal baseado no modo (add/edit ou delete)
  const renderContent = () => {
    if (state.mode === 'delete' && state.professional) {
      return (
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Confirmar Exclusão</h3>
          <p className="text-gray-300 mb-6">
            Tem certeza que deseja excluir <strong>{state.professional.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onDelete(state.professional!.id)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{state.mode === 'add' ? 'Adicionar Novo Profissional' : 'Editar Profissional'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-28 h-28">
              <img
                src={imagePreview || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=1f2937&color=daa520&size=128`}
                alt="Pré-visualização"
                className="w-28 h-28 rounded-full object-cover border-4 border-gray-700"
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#daa520] p-2 rounded-full text-black hover:bg-[#c8961e] transition-colors shadow-lg">
                <UploadCloud size={18} />
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            </div>
            <div className="relative w-full">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Nome do Profissional"
                required
                className="w-full bg-gray-800 text-white p-3 pl-12 rounded-lg focus:ring-2 focus:ring-[#daa520] border border-gray-700 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar'}
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
      <div className="bg-gray-900/80 p-8 rounded-2xl w-full max-w-md border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
        {renderContent()}
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
const ProfessionalsManagement = () => {
  const { userProfile, manageProfessionals, uploadImage } = useAuthStore();
  const { showToast } = useToast();
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [isLoading, setIsLoading] = useState(false);

  // Função para salvar (criação e edição)
  const handleSave = async (professionalData: Professional, imageFile: File | null) => {
    if (!userProfile?.uid) return;
    setIsLoading(true);

    try {
      let finalData = { ...professionalData };

      // 1. Se houver um novo arquivo de imagem, faz o upload
      if (imageFile) {
        const uploadPath = `professionals/${userProfile.uid}/${finalData.id}/${imageFile.name}`;
        const photoURL = await uploadImage(imageFile, uploadPath);
        finalData.photoURL = photoURL;
      }
      
      const existingProfessionals = userProfile.professionals || [];
      
      // 2. Prepara a nova lista de profissionais
      const isEditing = modalState.mode === 'edit';
      const updatedProfessionals = isEditing
        ? existingProfessionals.map(p => p.id === finalData.id ? finalData : p)
        : [...existingProfessionals, finalData];
      
      // 3. Chama a função do store para atualizar o Firestore e o estado global
      await manageProfessionals(updatedProfessionals);

      showToast(`Profissional ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
      setModalState({ isOpen: false, mode: 'add' });
    } catch (error) {
      showToast('Ocorreu um erro ao salvar o profissional.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para deletar
  const handleDelete = async (professionalId: string) => {
    if (!userProfile?.professionals) return;
    setIsLoading(true);

    try {
      // 1. Prepara a nova lista sem o profissional excluído
      const updatedProfessionals = userProfile.professionals.filter(p => p.id !== professionalId);
      
      // 2. Chama a função do store
      await manageProfessionals(updatedProfessionals);

      showToast('Profissional excluído com sucesso!', 'success');
      setModalState({ isOpen: false, mode: 'add' });
    } catch (error) {
      showToast('Ocorreu um erro ao excluir o profissional.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const professionals = userProfile?.professionals || [];

  return (
    <div className="p-4 sm:p-6">
      <ProfessionalModal
        state={modalState}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        onSave={handleSave}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-white">Equipe de Profissionais</h2>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'add' })}
          className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20"
        >
          <PlusCircle className="h-5 w-5" />
          Adicionar Profissional
        </button>
      </div>

      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {professionals.map(prof => (
            <div key={prof.id} className="group relative bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center">
                <img
                  src={prof.photoURL || `https://ui-avatars.com/api/?name=${prof.name}&background=1f2937&color=daa520&size=80`}
                  alt={`Foto de ${prof.name}`}
                  className="h-20 w-20 rounded-full object-cover border-4 border-gray-900/50"
                />
                <div className="ml-4 overflow-hidden">
                  <h3 className="text-xl font-bold text-white truncate">{prof.name}</h3>
                  <p className="text-sm text-gray-400">{prof.services?.length || 0} serviços</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => setModalState({ isOpen: true, mode: 'edit', professional: prof })} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white"><Edit size={16} /></button>
                <button onClick={() => setModalState({ isOpen: true, mode: 'delete', professional: prof })} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
          <User size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">Nenhum profissional adicionado</h3>
          <p className="text-sm mt-2">Comece adicionando os membros da sua equipe.</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsManagement;
