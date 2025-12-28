import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";

export const AgendaModalsWrapper = () => {
  const { modalView, closeModal, selectedAppointment, setModalView } =
    useAgendaModalStore();
  const { updateStatus, completeAppointment, cancelAppointment, isLoading } =
    useProviderAppointmentsStore();

  if (!selectedAppointment) return null;

  return (
    <>
      {/* Detalhes do Agendamento */}
      <AppointmentDetailsModal
        isOpen={modalView === "details"}
        onClose={() => closeModal()}
        appointment={selectedAppointment}
        onStatusChange={(id, status) => {
          if (status === "cancelled") {
            setModalView("cancel");
          } else {
            updateStatus(id, status);
            closeModal();
          }
        }}
        onComplete={() => {
          setModalView("complete");
        }}
      />

      {/* Modal de Conclusão (Valor Final) */}
      <ServiceCompletionModal
        isOpen={modalView === "complete"}
        onClose={() => closeModal()}
        appointment={selectedAppointment}
        isLoading={isLoading}
        onConfirm={async (finalPrice) => {
          await completeAppointment(selectedAppointment.id, finalPrice);
          closeModal();
        }}
      />

      {/* Modal de Cancelamento (Motivo) */}
      <CancelAppointmentModal
        isOpen={modalView === "cancel"}
        onClose={() => closeModal()}
        appointmentId={selectedAppointment.id}
        userType="serviceProvider"
        isLoading={isLoading}
        onConfirm={async (reason) => {
          await cancelAppointment(selectedAppointment.id, reason);
          closeModal();
        }}
      />
    </>
  );
};
