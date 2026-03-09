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
    loading: isLoading,
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
                } else if (
                  normalizedStatus === "confirmed" ||
                  normalizedStatus === "scheduled"
                ) {
                  await confirmAppointment(id);
                  closeModal();
                  toast.success("Agendamento confirmado!");
                } else if (normalizedStatus === "no_show") {
                  await markNoShow(id);
                  closeModal();
                  toast.success("Falta registrada (No-Show).");
                }
              } catch (error) {
                console.error("Erro ao mudar status do agendamento:", error);
                toast.error("Falha ao atualizar o status.");
              }
            }}
            onComplete={async () => {
              // Pega o valor total, suportando tanto o padrão antigo (totalAmount) quanto o novo do backend (totalPrice)
              const price = (selectedAppointment as any).totalPrice ?? (selectedAppointment as any).totalAmount ?? 0;
              
              // ✨ Usamos apenas "BLOCKED" (maiúsculas) para bater certo com os types.ts
              const isBlock = selectedAppointment.status === "BLOCKED";

              if (price === 0 || isBlock) {
                try {
                  await completeAppointment(selectedAppointment.id, {
                    appointmentId: selectedAppointment.id, // OBRIGATÓRIO PARA O BACKEND
                    paymentMethod: "CASH",
                    serviceFinalPrice: 0,                  // SUBSTITUI O finalAmount
                    soldProducts: [],                      // ARRAY VAZIO PARA EVITAR NULL POINTER
                  });
                  closeModal();
                  toast.success("Compromisso finalizado!");
                } catch (error) {
                  console.error("Erro ao finalizar compromisso:", error);
                  toast.error("Falha ao finalizar o compromisso.");
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
            onConfirm={async (payload: number | any) => {
              try {
                let requestData: CompleteAppointmentRequest;

                if (typeof payload === "number") {
                  // Se o modal mandar apenas um número
                  requestData = {
                    appointmentId: selectedAppointment.id, // OBRIGATÓRIO
                    serviceFinalPrice: payload,            // NOME CORRETO
                    paymentMethod: "CASH",
                    soldProducts: [],
                  };
                } else {
                  // Se o modal mandar um objeto, adaptamos para garantir a conformidade
                  requestData = {
                    appointmentId: selectedAppointment.id, // OBRIGATÓRIO
                    paymentMethod: payload.paymentMethod || "CASH",
                    // Aceita a nova tipagem, ou faz fallback se o modal ainda enviar "finalAmount" internamente
                    serviceFinalPrice: payload.serviceFinalPrice ?? payload.finalAmount ?? 0,
                    soldProducts: payload.soldProducts || [],
                  };
                }

                await completeAppointment(selectedAppointment.id, requestData);
                closeModal();
                toast.success("Atendimento concluído com sucesso!");
              } catch (error) {
                console.error("Falha ao concluir", error);
                toast.error("Ocorreu um erro ao finalizar o atendimento.");
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
                toast.success("Agendamento cancelado.");
              } catch (error) {
                console.error("Falha ao cancelar", error);
                toast.error("Falha ao cancelar o agendamento.");
              }
            }}
          />
        </>
      )}
    </>
  );
};