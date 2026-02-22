import { toast } from "react-hot-toast";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ManualAppointmentModal } from "./ManualAppointmentModal";

// ✨ Importamos a tipagem do request de Checkout/Conclusão
import type { CompleteAppointmentRequest } from "../../../types";

export const AgendaModalsWrapper = () => {
  const {
    modalView,
    closeModal,
    selectedAppointment,
    openModal, // ✨ Trocamos setModalView por openModal
    modalData,
  } = useAgendaModalStore();

  const { 
    confirmAppointment,
    cancelAppointment,
    markNoShow,
    completeAppointment, 
    loading: isLoading 
  } = useProviderAppointmentsStore();

  return (
    <>
      {/* O Modal Manual abre independente de ter um appointment selecionado */}
      <ManualAppointmentModal
        isOpen={modalView === "manual_booking"}
        onClose={closeModal}
        defaultDate={modalData?.defaultDate} // ✨ Agora já não dá erro de "unknown"
      />

      {/* Modais que exigem um agendamento existente */}
      {selectedAppointment && (
        <>
          <AppointmentDetailsModal
            isOpen={modalView === "details"}
            onClose={closeModal}
            appointment={selectedAppointment}
            onStatusChange={async (id, status) => {
              const normalizedStatus = status.toLowerCase();
              
              try {
                if (normalizedStatus === "cancelled") {
                  // ✨ Usamos openModal para transitar a view mantendo a marcação
                  openModal("cancel", selectedAppointment, modalData);
                } else if (normalizedStatus === "confirmed" || normalizedStatus === "scheduled") {
                  await confirmAppointment(id);
                  closeModal();
                } else if (normalizedStatus === "no_show") {
                  await markNoShow(id);
                  closeModal();
                }
              } catch (error) {
                console.error("Erro ao mudar status do agendamento:", error);
              }
            }}
            onComplete={async () => {
              const price = selectedAppointment.totalAmount || 0;
              // ✨ Usamos apenas "BLOCKED" (maiúsculas) para bater certo com os types.ts
              const isBlock = selectedAppointment.status === "BLOCKED";

              if (price === 0 || isBlock) {
                try {
                  await completeAppointment(selectedAppointment.id, {
                    paymentMethod: "CASH", 
                    finalAmount: 0,
                  });
                  closeModal();
                  toast.success("Compromisso finalizado!");
                } catch (error) {
                  console.error(error);
                }
              } else {
                // ✨ Usamos openModal para ir para o ecrã de checkout
                openModal("complete", selectedAppointment, modalData);
              }
            }}
          />

          <ServiceCompletionModal
            isOpen={modalView === "complete"}
            onClose={closeModal}
            appointment={selectedAppointment}
            isLoading={isLoading}
            onConfirm={async (payload: number | CompleteAppointmentRequest) => {
              try {
                if (typeof payload === 'number') {
                  await completeAppointment(selectedAppointment.id, {
                    finalAmount: payload,
                    paymentMethod: "CASH"
                  });
                } else {
                  await completeAppointment(selectedAppointment.id, payload);
                }
                closeModal();
              } catch (error) {
                console.error("Falha ao concluir", error);
              }
            }}
          />

          <CancelAppointmentModal
            isOpen={modalView === "cancel"}
            onClose={closeModal}
            appointmentId={selectedAppointment.id}
            userType="serviceProvider"
            isLoading={isLoading}
            onConfirm={async (reason) => {
              try {
                await cancelAppointment(selectedAppointment.id, reason);
                closeModal();
              } catch (error) {
                console.error("Falha ao cancelar", error);
              }
            }}
          />
        </>
      )}
    </>
  );
};