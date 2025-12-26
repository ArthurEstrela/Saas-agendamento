import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useServiceManagementStore } from "../../store/serviceManagementStore";
import { ServiceModal } from "./ServiceModal";
import { ServiceCard } from "./ServiceCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { Loader2, ListPlus, Wrench } from "lucide-react";
import type { Service } from "../../types";

// UI
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";

export const ServicesManagement = () => {
  const { userProfile } = useProfileStore();
  const {
    isSubmitting: isLoading,
    addService,
    updateService,
    removeService,
  } = useServiceManagementStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    service: Service | null;
  }>({ isOpen: false, service: null });

  const services =
    userProfile?.role === "serviceProvider" && userProfile.services
      ? userProfile.services
      : [];

  const handleOpenModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Service, "id">) => {
    if (!userProfile) return;
    if (editingService)
      await updateService(userProfile.id, editingService.id, data);
    else await addService(userProfile.id, data);
    setIsModalOpen(false);
    setEditingService(null);
  };

  const confirmDelete = () => {
    if (userProfile && confirmState.service)
      removeService(userProfile.id, confirmState.service);
    setConfirmState({ isOpen: false, service: null });
  };

  if (!userProfile)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <Typography variant="h2" className="text-3xl font-bold">
            Meus Serviços
          </Typography>
          <Typography variant="muted" className="mt-1">
            Gerencie seu catálogo de serviços.
          </Typography>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2 font-bold shadow-lg shadow-primary/20"
        >
          <ListPlus size={18} /> Adicionar Serviço
        </Button>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleOpenModal(service)}
              onDelete={() => setConfirmState({ isOpen: true, service })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
          <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-500">
            <Wrench size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Nenhum serviço cadastrado
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm text-center">
            Adicione serviços para que seus clientes possam agendar horários com
            você.
          </p>
          <Button variant="outline" onClick={() => handleOpenModal()}>
            Começar Agora
          </Button>
        </div>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        service={editingService}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, service: null })}
        onConfirm={confirmDelete}
        title="Excluir Serviço?"
        message={`Deseja realmente remover "${confirmState.service?.name}"? Isso não pode ser desfeito.`}
        confirmText="Excluir"
      />
    </div>
  );
};
