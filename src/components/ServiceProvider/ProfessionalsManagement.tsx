import { useState, useMemo, useEffect } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProfessionalsManagementStore } from "../../store/professionalsManagementStore";
import { ProfessionalModal } from "./ProfessionalModal";
import { ProfessionalCard } from "./ProfessionalCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { Loader2, Users, UserPlus, AlertCircle } from "lucide-react"; // Adicionei AlertCircle
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
    fetchProfessionals,
    registerOwnerAsProfessional, // <--- Destructure da nova função
  } = useProfessionalsManagementStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    prof: Professional | null;
  }>({ isOpen: false, prof: null });

  useEffect(() => {
    if (userProfile?.role === "serviceProvider" && userProfile.id) {
      fetchProfessionals(userProfile.id);
    }
  }, [userProfile, fetchProfessionals]);

  const providerProfile = userProfile as ServiceProviderProfile;
  const services = providerProfile?.services || [];

  const sortedProfessionals = useMemo(() => {
    if (!professionalsState) return [];
    return [...professionalsState].sort((a, b) => {
      return a.isOwner === b.isOwner ? 0 : a.isOwner ? -1 : 1;
    });
  }, [professionalsState]);

  // ✅ Verifica se o dono já está na lista
  const hasOwnerProfile = useMemo(() => {
    return sortedProfessionals.some((p) => p.isOwner);
  }, [sortedProfessionals]);

  if (!userProfile || userProfile.role !== "serviceProvider") return null;

  // -- Funções de Handler --

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
        isOwner: editingProfessional.isOwner,
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
    if (confirmState.prof?.isOwner) {
      setConfirmState({ isOpen: false, prof: null });
      return;
    }

    if (confirmState.prof)
      removeProfessional(providerProfile.id, confirmState.prof.id);
    setConfirmState({ isOpen: false, prof: null });
  };

  // Handler para criar o perfil do dono
  const handleActivateOwner = async () => {
    await registerOwnerAsProfessional(
      providerProfile.id,
      providerProfile.name,
      providerProfile.email,
      providerProfile.profilePictureUrl || ""
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <Typography variant="h2" className="text-3xl font-bold">
            Equipe
          </Typography>
          <Typography variant="muted" className="mt-1">
            Gerencie os profissionais e suas especialidades.
          </Typography>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} /> Novo Profissional
        </Button>
      </div>

      {/* ✅ BANNER DE ALERTA SE O DONO NÃO ESTIVER NA LISTA */}
      {!isLoading && !hasOwnerProfile && professionalsState !== null && (
        <div className="bg-blue-900/20 border border-blue-800 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 animate-fade-in shadow-lg shadow-blue-900/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 mt-1">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-100 mb-1">
                Você não está aparecendo na agenda!
              </h4>
              <p className="text-sm text-blue-300 leading-relaxed max-w-xl">
                Seu perfil de administrador existe, mas você ainda não está
                listado como um profissional que realiza atendimentos. Clique no
                botão ao lado para ativar seu perfil na equipe.
              </p>
            </div>
          </div>
          <Button
            onClick={handleActivateOwner}
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-6 h-auto shadow-xl shadow-blue-900/20"
          >
            Ativar meu Perfil de Atendimento
          </Button>
        </div>
      )}

      {professionalsState === null ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : sortedProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProfessionals.map((prof) => (
            <ProfessionalCard
              key={prof.id}
              professional={prof}
              onEdit={() => handleOpenModal(prof)}
              onDelete={() => setConfirmState({ isOpen: true, prof })}
            />
          ))}
        </div>
      ) : (
        /* Se a lista estiver vazia e não tiver o banner acima (caso raro), mostra empty state */
        !hasOwnerProfile && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl animate-fade-in">
            <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Sua equipe está vazia
            </h3>
            <p className="text-gray-400 mb-6 max-w-sm text-center">
              Comece adicionando profissionais para distribuir os agendamentos.
            </p>
            <Button variant="outline" onClick={() => handleOpenModal()}>
              Adicionar Profissional
            </Button>
          </div>
        )
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
        message={`Tem certeza que deseja remover "${confirmState.prof?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
      />
    </div>
  );
};