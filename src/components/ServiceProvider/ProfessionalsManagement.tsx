import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";
import { ProfessionalModal } from "./ProfessionalModal";
import { ProfessionalCard } from "./ProfessionalCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { Loader2, Users, UserPlus } from "lucide-react";
import type { Professional, ServiceProviderProfile } from "../../types";

// UI
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";

type ProfessionalFormData = {
  name: string;
  email?: string;
  password?: string;
  serviceIds: string[];
};

export const ProfessionalsManagement = () => {
  const userProfile = useProfileStore((state) => state.userProfile);
  const professionalsState = useProfileStore((state) => state.professionals);
  const {
    isSubmitting: isLoading,
    addProfessional,
    updateProfessional,
    removeProfessional,
  } = useProfessionalsManagementStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    prof: Professional | null;
  }>({ isOpen: false, prof: null });

  if (!userProfile || userProfile.role !== "serviceProvider") return null;

  const providerProfile = userProfile as ServiceProviderProfile;
  const services = providerProfile.services || [];
  const professionals = professionalsState || [];

  const handleOpenModal = (prof: Professional | null = null) => {
    setEditingProfessional(prof);
    setIsModalOpen(true);
  };

  const handleSave = async (
    formData: ProfessionalFormData,
    photoFile: File | null
  ) => {
    const selectedServices = services.filter((s) =>
      formData.serviceIds.includes(s.id)
    );

    if (editingProfessional) {
      await updateProfessional(providerProfile.id, editingProfessional.id, {
        name: formData.name,
        services: selectedServices,
        availability: editingProfessional.availability || [],
        photoFile,
        photoURL: editingProfessional.photoURL,
      });
    } else {
      await addProfessional(providerProfile.id, {
        name: formData.name,
        email: formData.email!,
        password: formData.password!,
        services: selectedServices,
        serviceIds: formData.serviceIds,
        availability: [],
        photoFile,
      });
    }
    setIsModalOpen(false);
    setEditingProfessional(null);
  };

  const confirmDelete = () => {
    if (confirmState.prof)
      removeProfessional(providerProfile.id, confirmState.prof.id);
    setConfirmState({ isOpen: false, prof: null });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <Typography variant="h2" className="text-3xl font-bold">
            Equipe
          </Typography>
          <Typography variant="muted" className="mt-1">
            Gerencie os profissionais do seu negócio.
          </Typography>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} /> Novo Profissional
        </Button>
      </div>

      {professionalsState === null ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {professionals.map((prof) => (
            <ProfessionalCard
              key={prof.id}
              professional={prof}
              onEdit={() => handleOpenModal(prof)}
              onDelete={() => setConfirmState({ isOpen: true, prof })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
          <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-500">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Sua equipe está vazia
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm text-center">
            Cadastre profissionais para distribuir os agendamentos.
          </p>
          <Button variant="outline" onClick={() => handleOpenModal()}>
            Adicionar Profissional
          </Button>
        </div>
      )}

      <ProfessionalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        professional={editingProfessional}
        availableServices={services}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, prof: null })}
        onConfirm={confirmDelete}
        title="Remover Profissional?"
        message={`Tem certeza que deseja remover "${confirmState.prof?.name}"?`}
        confirmText="Remover"
      />
    </div>
  );
};
