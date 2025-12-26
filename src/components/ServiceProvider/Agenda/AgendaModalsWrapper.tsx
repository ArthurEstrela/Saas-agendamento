import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useReviewStore } from "../../../store/reviewStore"; // Se necessário
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";

export const AgendaModalsWrapper = () => {
  const { modals, closeModal, selectedAppointment } = useAgendaModalStore();
  const { updateStatus, completeAppointment, cancelAppointment, isLoading } =
    useProviderAppointmentsStore();

  if (!selectedAppointment) return null;

  return (
    <>
      {/* Detalhes */}
      <AppointmentDetailsModal
        isOpen={modals.details}
        onClose={() => closeModal("details")}
        appointment={selectedAppointment}
        onStatusChange={(id, status) => {
          if (status === "cancelled") {
            // Abre o modal de cancelamento em vez de cancelar direto
            // A lógica de abrir outro modal pode ser tratada no store se preferir
            closeModal("details");
            // Aqui você chamaria openModal('cancel', selectedAppointment)
          } else {
            updateStatus(id, status);
            closeModal("details");
          }
        }}
        onComplete={() => {
          closeModal("details");
          // Abre modal de conclusão (valor final)
          // openModal('completion', selectedAppointment) -- precisa implementar no store
        }}
      />

      {/* Conclusão (Valor Final) */}
      <ServiceCompletionModal
        isOpen={modals.completion}
        onClose={() => closeModal("completion")}
        appointment={selectedAppointment}
        isLoading={isLoading}
        onConfirm={async (finalPrice) => {
          await completeAppointment(selectedAppointment.id, finalPrice);
          closeModal("completion");
        }}
      />

      {/* Cancelamento */}
      <CancelAppointmentModal
        isOpen={modals.cancel}
        onClose={() => closeModal("cancel")}
        appointmentId={selectedAppointment.id}
        userType="serviceProvider"
        isLoading={isLoading}
        onConfirm={async (reason) => {
          await cancelAppointment(selectedAppointment.id, reason);
          closeModal("cancel");
        }}
      />
    </>
  );
};
