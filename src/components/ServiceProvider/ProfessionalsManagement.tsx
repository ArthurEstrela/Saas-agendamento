import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useProfessionalsManagementStore } from '../../store/professionalsManagementStore';
import { ProfessionalModal } from './ProfessionalModal';
import { ProfessionalCard } from './ProfessionalCard'; // Importa o novo card
import { ConfirmationModal } from '../Common/ConfirmationModal'; // Importa o modal de confirmação
import { Loader2, Users, UserPlus } from 'lucide-react';

export const ProfessionalsManagement = () => {
  const { userProfile } = useProfileStore();
  const { isSubmitting: isLoading, addProfessional, updateProfessional, removeProfessional: deleteProfessional } = useProfessionalsManagementStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  // Estado para o modal de confirmação
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, professionalToDelete: null });

  const professionals = (userProfile?.role === 'serviceProvider' && userProfile.professionals) ? userProfile.professionals : [];
  const services = (userProfile?.role === 'serviceProvider' && userProfile.services) ? userProfile.services : [];

  const handleOpenModal = (professional = null) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
  };

  const handleSaveProfessional = async (formData, photoFile) => {
    if (!userProfile) return;
    const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
    const payload = { name: formData.name, services: selectedServices, availability: [], photoFile };
    if (editingProfessional) {
      const updatedPayload = { ...payload, photoURL: editingProfessional.photoURL };
      await updateProfessional(userProfile.id, editingProfessional.id, updatedPayload);
    } else {
      await addProfessional(userProfile.id, payload);
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (professional) => {
    setConfirmationState({ isOpen: true, professionalToDelete: professional });
  };

  const confirmDelete = () => {
    if (userProfile && confirmationState.professionalToDelete) {
      deleteProfessional(userProfile.id, confirmationState.professionalToDelete);
    }
    setConfirmationState({ isOpen: false, professionalToDelete: null });
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">Meus Profissionais</h1>
          <p className="text-lg text-gray-400 mt-2">Gerencie a equipe que atende em seu estabelecimento.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="primary-button flex items-center gap-2">
          <UserPlus size={20} />
          Adicionar Profissional
        </button>
      </div>

      {/* Lista de Profissionais */}
      {!userProfile ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-500" size={48} /></div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {professionals.map(prof => (
            <ProfessionalCard 
              key={prof.id} 
              professional={prof}
              onEdit={() => handleOpenModal(prof)}
              onDelete={() => handleDeleteRequest(prof)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
          <Users size={48} className="mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">Nenhum profissional cadastrado</h3>
          <p>Clique em "Adicionar Profissional" para começar.</p>
        </div>
      )}

      {/* Modais */}
      <ProfessionalModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProfessional}
        professional={editingProfessional}
        availableServices={services}
        isLoading={isLoading}
      />
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ isOpen: false, professionalToDelete: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir permanentemente o profissional "${confirmationState.professionalToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};