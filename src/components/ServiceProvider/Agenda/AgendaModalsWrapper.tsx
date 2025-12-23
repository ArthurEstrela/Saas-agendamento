// src/components/ServiceProvider/Agenda/AgendaModalsWrapper.tsx

import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useToast } from "../../../hooks/useToast";

// Importe os seus 3 componentes de modal
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";
import type { Appointment } from "../../../types";

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
  
  // ✅ 1. CORREÇÃO: Usar showSuccess e showError em vez de showToast (que não existe)
  const { showSuccess, showError } = useToast();

  // --- Handlers de Confirmação ---

  const handleConfirmCompletion = async (finalPrice: number) => {
    if (!selectedAppointment) return;
    try {
      await completeAppointment(selectedAppointment.id, finalPrice);
      showSuccess("Agendamento concluído com sucesso!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao concluir.";
      showError(msg);
    } finally {
      closeModal();
    }
  };

  const handleConfirmCancelOrDecline = async (reason: string) => {
    if (!selectedAppointment) return;
    const isDeclining = modalView === "decline";
    try {
      // ✅ 2. CORREÇÃO: Passar 'undefined' no 3º argumento (finalPrice)
      // A assinatura é: (id, status, finalPrice?, rejectionReason?)
      await updateStatus(selectedAppointment.id, "cancelled", undefined, reason);
      
      showSuccess(`Agendamento ${isDeclining ? "recusado" : "cancelado"} com sucesso!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao processar.";
      showError(msg);
    } finally {
      closeModal();
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedAppointment) return;
    try {
      await updateStatus(selectedAppointment.id, "scheduled");
      showSuccess("Agendamento confirmado!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao confirmar.";
      showError(msg);
    } finally {
      closeModal();
    }
  };

  // ✅ 3. Lógica de Mapeamento para o Modal de Detalhes
  // O modal emite 'onStatusChange', nós decidimos o que fazer com base no status.
  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    if (newStatus === 'scheduled') {
      // Confirmar agendamento
      handleConfirmAccept();
    } else if (newStatus === 'cancelled') {
      // Se era pendente e foi cancelado = Recusar. Se era agendado = Cancelar.
      if (selectedAppointment?.status === 'pending') {
        setModalView("decline");
      } else {
        setModalView("cancel");
      }
    }
  };

  return (
    <>
      {/* Modal de Detalhes */}
      <AppointmentDetailsModal
        isOpen={modalView === "details"}
        onClose={closeModal}
        appointment={selectedAppointment}
        
        // ✅ 4. CORREÇÃO: Passar as props que o componente realmente espera
        onStatusChange={handleStatusChange}
        onComplete={() => setModalView("complete")}
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
        intent={modalView === "decline" ? "decline" : "cancel"}
        isLoading={isLoading}
      />
    </>
  );
};