// src/components/ServiceProvider/Agenda/AgendaModalsWrapper.tsx

import { toast } from "react-hot-toast";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ManualAppointmentModal } from "./ManualAppointmentModal";

export const AgendaModalsWrapper = () => {
  // Agora modalData e o valor "manual_booking" são reconhecidos pelo TS
  const {
    modalView,
    closeModal,
    selectedAppointment,
    setModalView,
    modalData,
  } = useAgendaModalStore();

  const { updateStatus, completeAppointment, cancelAppointment, isLoading } =
    useProviderAppointmentsStore();

  return (
    <>
      {/* O Modal Manual abre independente de ter um appointment selecionado */}
      <ManualAppointmentModal
        isOpen={modalView === "manual_booking"}
        onClose={closeModal}
        defaultDate={modalData?.defaultDate}
      />

      {/* Modais que exigem um agendamento existente */}
      {selectedAppointment && (
        <>
          <AppointmentDetailsModal
            isOpen={modalView === "details"}
            onClose={closeModal}
            appointment={selectedAppointment}
            onStatusChange={(id, status) => {
              if (status === "cancelled") {
                setModalView("cancel", selectedAppointment);
              } else {
                updateStatus(id, status);
                closeModal();
              }
            }}
            onComplete={() => {
              if (
                selectedAppointment.totalPrice === 0 ||
                selectedAppointment.isPersonalBlock
              ) {
                updateStatus(selectedAppointment.id, "completed");
                closeModal();
                // Dica: Adicionar um feedback
                toast.success("Compromisso finalizado!");
              } else {
                setModalView("complete");
              }
            }}
          />

          <ServiceCompletionModal
            isOpen={modalView === "complete"}
            onClose={closeModal}
            appointment={selectedAppointment}
            isLoading={isLoading}
            onConfirm={async (finalPrice) => {
              await completeAppointment(selectedAppointment.id, finalPrice);
              closeModal();
            }}
          />

          <CancelAppointmentModal
            isOpen={modalView === "cancel"}
            onClose={closeModal}
            appointmentId={selectedAppointment.id}
            userType="serviceProvider"
            isLoading={isLoading}
            onConfirm={async (reason) => {
              await cancelAppointment(selectedAppointment.id, reason);
              closeModal();
            }}
          />
        </>
      )}
    </>
  );
};
