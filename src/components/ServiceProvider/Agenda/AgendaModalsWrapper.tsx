// Em src/components/ServiceProvider/Agenda/AgendaModalsWrapper.tsx

import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useToast } from "../../../hooks/useToast";

// Importe os seus 3 componentes de modal
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";

/**
 * Este componente gere a lógica e a renderização de todos os modals
 * da Agenda, ouvindo a 'useAgendaModalStore'.
 */
export const AgendaModalsWrapper = () => {
  const { modalView, selectedAppointment, closeModal, setModalView } = useAgendaModalStore();
  const { 
    isLoading, 
    completeAppointment, 
    updateStatus 
  } = useProviderAppointmentsStore();
  
  const { showToast } = useToast();

  // --- Handlers de Confirmação (movidos do AgendaView) ---

  const handleConfirmCompletion = async (finalPrice: number) => {
    if (!selectedAppointment) return;
    try {
      await completeAppointment(selectedAppointment.id, finalPrice);
      showToast("Sucesso", "Agendamento concluído com sucesso!", "success");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao concluir.";
      showToast("Erro", msg, "error");
    } finally {
      closeModal(); // Fecha o modal em qualquer caso
    }
  };

  const handleConfirmCancelOrDecline = async (reason: string) => {
    if (!selectedAppointment) return;
    const isDeclining = modalView === "decline";
    try {
      await updateStatus(selectedAppointment.id, "cancelled", reason);
      showToast(
        "Sucesso",
        `Agendamento ${isDeclining ? "recusado" : "cancelado"} com sucesso!`,
        "success"
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao processar.";
      showToast("Erro", msg, "error");
    } finally {
      closeModal();
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedAppointment) return;
    try {
      await updateStatus(selectedAppointment.id, "scheduled");
      showToast("Sucesso", "Agendamento confirmado!", "success");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao confirmar.";
      showToast("Erro", msg, "error");
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {/* Modal de Detalhes */}
      <AppointmentDetailsModal
        isOpen={modalView === "details"}
        onClose={closeModal}
        appointment={selectedAppointment}
        // As ações dentro do 'details' agora apenas mudam o 'view' da store
        onAccept={handleConfirmAccept}
        onOpenCompletion={() => setModalView("complete")}
        onOpenCancel={() => setModalView("cancel")}
        onDecline={() => setModalView("decline")}
      />
      
      {/* Modal de Conclusão */}
      <ServiceCompletionModal
        isOpen={modalView === "complete"}
        onClose={closeModal}
        onConfirm={handleConfirmCompletion}
        appointment={selectedAppointment}
        isLoading={isLoading}
      />
      
      {/* Modal de Cancelar/Recusar */}
      <CancelAppointmentModal
        isOpen={modalView === "cancel" || modalView === "decline"}
        onClose={closeModal}
        appointmentId={selectedAppointment?.id || ""}
        onConfirm={handleConfirmCancelOrDecline}
        userType="serviceProvider"
        // O 'intent' muda o texto do modal
        intent={modalView === "decline" ? "decline" : "cancel"}
        isLoading={isLoading}
      />
    </>
  );
};