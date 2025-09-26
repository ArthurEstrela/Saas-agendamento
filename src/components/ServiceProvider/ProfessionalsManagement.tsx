import { useState } from "react";
// O shallow não é estritamente necessário se usarmos seletores individuais,
// mas pode ser mantido para seletores mais complexos se necessário.
// Neste caso, vamos priorizar a chamada individual.
import { useProfileStore } from "../../store/profileStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";
import { ProfessionalModal } from "./ProfessionalModal";
import { ProfessionalCard } from "./ProfessionalCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { Loader2, Users, UserPlus } from "lucide-react";
// Importar o tipo ServiceProviderProfile é essencial para o "narrowing" de tipo
import type {
  Professional,
  Service,
  ServiceProviderProfile,
} from "../../types";

export const ProfessionalsManagement = () => {
  // 1. CHAME TODOS OS HOOKS NO TOPO DO COMPONENTE
  // Isso resolve as warnings: "React Hook 'use...' is called conditionally."

  // Seletores individuais do Zustand para buscar as propriedades estáveis
  const userProfile = useProfileStore((state) => state.userProfile);
  const professionalsState = useProfileStore((state) => state.professionals);

  // Hooks do ProfessionalsManagementStore
  const {
    isSubmitting: isLoading,
    addProfessional,
    updateProfessional,
    removeProfessional: deleteProfessional,
  } = useProfessionalsManagementStore();

  // Hooks de Estado Local (useState)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    professionalToDelete: Professional | null;
  }>({
    isOpen: false,
    professionalToDelete: null,
  });

  // 2. LÓGICA CONDICIONAL E EARLY RETURN DEPOIS DOS HOOKS
  // Verifica se o perfil carregou e se é do tipo ServiceProvider.
  if (!userProfile || userProfile.role !== "serviceProvider") {
    // Exibe um loader se estiver carregando, ou null se não for o papel correto
    if (!userProfile) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      );
    }
    return null;
  }

  // 3. NARRAÇÃO DE TIPO (Type Narrowing)
  // Depois do check, o TypeScript sabe que userProfile é ServiceProviderProfile
  const providerProfile = userProfile as ServiceProviderProfile;

  // 4. DERIVAÇÃO SEGURA DE ESTADO (Fora do Seletor)
  const services: Service[] = providerProfile.services || [];
  const professionals: Professional[] = professionalsState || [];
  const availableServices: Service[] = services;

  const handleOpenModal = (professional: Professional | null = null) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
  };

  const handleSaveProfessional = async (
    formData: any,
    photoFile: File | null
  ) => {
    const providerId = providerProfile.id; // Usando o perfil tipado

    const selectedServices = availableServices.filter((s) =>
      formData.serviceIds.includes(s.id)
    );

    const payload = {
      name: formData.name,
      services: selectedServices,
      availability: editingProfessional?.availability || [],
      photoFile,
    };

    if (editingProfessional) {
      const updatedPayload = {
        ...payload,
        photoURL: editingProfessional.photoURL,
      };
      await updateProfessional(
        providerId,
        editingProfessional.id,
        updatedPayload
      );
    } else {
      await addProfessional(providerId, payload);
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (professional: Professional) => {
    setConfirmationState({ isOpen: true, professionalToDelete: professional });
  };

  const confirmDelete = () => {
    // Já checamos o userProfile no topo, só precisamos checar a seleção
    if (confirmationState.professionalToDelete) {
      deleteProfessional(
        providerProfile.id,
        confirmationState.professionalToDelete.id
      );
    }
    setConfirmationState({ isOpen: false, professionalToDelete: null });
  };

  return (
    <div>
      {/* O resto do componente permanece inalterado, pois a lógica estava correta */}
      {/* ... (Cabeçalho) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">Meus Profissionais</h1>
          <p className="text-lg text-gray-400 mt-2">
            Gerencie a equipe que atende em seu estabelecimento.
          </p>
        </div>
        <div>
          <button
            onClick={() => handleOpenModal()}
            className="primary-button flex items-center gap-2"
          >
            <UserPlus size={20} />
            Adicionar Profissional
          </button>
        </div>
      </div>

      {/* Lista de Profissionais */}
      {professionalsState === null ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {professionals.map((prof) => (
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
          <h3 className="text-xl font-semibold text-gray-300">
            Nenhum profissional cadastrado
          </h3>
          <p>Clique em "Adicionar Profissional" para começar.</p>
        </div>
      )}

      {/* Modais */}
      <ProfessionalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProfessional}
        professional={editingProfessional}
        availableServices={availableServices}
        isLoading={isLoading}
      />
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() =>
          setConfirmationState({ isOpen: false, professionalToDelete: null })
        }
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir permanentemente o profissional "${
          confirmationState.professionalToDelete?.name || ""
        }"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};
