import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useServiceManagementStore } from "../../store/serviceManagementStore";
import { ServiceModal } from "./ServiceModal";
import { ServiceCard } from "./ServiceCard";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { Loader2, ListPlus, Wrench } from "lucide-react";

export const ServicesManagement = () => {
  const { userProfile } = useProfileStore();
  const {
    isSubmitting: isLoading,
    addService,
    updateService,
    removeService: deleteService,
  } = useServiceManagementStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    serviceToDelete: null,
  });

  const services =
    userProfile?.role === "serviceProvider" && userProfile.services
      ? userProfile.services
      : [];

  const handleOpenModal = (service = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSaveService = async (data) => {
    if (!userProfile) return;
    if (editingService) {
      await updateService(userProfile.id, { ...editingService, ...data });
    } else {
      await addService(userProfile.id, data);
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (service) => {
    setConfirmationState({ isOpen: true, serviceToDelete: service });
  };

  const confirmDelete = () => {
    if (userProfile && confirmationState.serviceToDelete) {
      deleteService(userProfile.id, confirmationState.serviceToDelete);
    }
    setConfirmationState({ isOpen: false, serviceToDelete: null });
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">Meus Serviços</h1>
          <p className="text-lg text-gray-400 mt-2">
            Adicione e gerencie os serviços que você oferece.
          </p>
        </div>
        <div>
          <button
            onClick={() => handleOpenModal()}
            className="primary-button flex items-center gap-2"
          >
            <ListPlus size={20} />
            Adicionar Serviço
          </button>
        </div>
      </div>

      {/* Lista de Serviços */}
      {!userProfile ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleOpenModal(service)}
              onDelete={() => handleDeleteRequest(service)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
          <Wrench size={48} className="mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">
            Nenhum serviço cadastrado
          </h3>
          <p>
            Clique em "Adicionar Serviço" para começar a montar seu catálogo.
          </p>
        </div>
      )}

      {/* Modais */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveService}
        service={editingService}
        isLoading={isLoading}
      />
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() =>
          setConfirmationState({ isOpen: false, serviceToDelete: null })
        }
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir permanentemente o serviço "${confirmationState.serviceToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
};
