import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";

export const AgendaModalsWrapper = () => {
  // CORREÇÃO 1: Usamos 'modalView' e 'setModalView' em vez de 'modals'
  const { modalView, closeModal, selectedAppointment, setModalView } = useAgendaModalStore();
  const { updateStatus, completeAppointment, cancelAppointment, isLoading } =
    useProviderAppointmentsStore();

  if (!selectedAppointment) return null;

  return (
    <>
      {/* Detalhes */}
      <AppointmentDetailsModal
        // CORREÇÃO 2: Verificamos se a string do modal ativo é 'details'
        isOpen={modalView === "details"}
        // CORREÇÃO 3: closeModal() não recebe argumentos
        onClose={() => closeModal()}
        appointment={selectedAppointment}
        onStatusChange={(id, status) => {
          if (status === "cancelled") {
            // CORREÇÃO 4: Usamos setModalView para trocar de modal sem fechar tudo
            setModalView("cancel");
          } else {
            updateStatus(id, status);
            closeModal();
          }
        }}
        onComplete={() => {
          // CORREÇÃO 5: Troca direta para o modal de conclusão
          setModalView("complete");
        }}
      />

      {/* Conclusão (Valor Final) */}
      <ServiceCompletionModal
        // CORREÇÃO 6: O tipo no store é "complete", não "completion"
        isOpen={modalView === "complete"}
        onClose={() => closeModal()}
        appointment={selectedAppointment}
        isLoading={isLoading}
        onConfirm={async (finalPrice) => {
          await completeAppointment(selectedAppointment.id, finalPrice);
          closeModal();
        }}
      />

      {/* Cancelamento */}
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