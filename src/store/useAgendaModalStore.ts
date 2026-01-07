import { create } from "zustand";
import type { Appointment } from "../types";

// Define quais modals/ações podem estar ativas
type ModalView = "details" | "complete" | "cancel" | "decline";

interface AgendaModalState {
  modalView: ModalView | null;
  selectedAppointment: Appointment | null;
  
  /**
   * Abre um modal para uma ação e agendamento específicos.
   */
  openModal: (view: ModalView, appointment: Appointment) => void;
  
  /**
   * Fecha qualquer modal que esteja aberto, limpando o agendamento.
   */
  closeModal: () => void;
  
  /**
   * Muda o modal ativo (ex: de 'details' para 'cancel').
   */
  setModalView: (view: ModalView) => void;
}

export const useAgendaModalStore = create<AgendaModalState>((set) => ({
  modalView: null,
  selectedAppointment: null,
  
  openModal: (view, appointment) => {
    set({ modalView: view, selectedAppointment: appointment });
  },
  
  closeModal: () => {
    set({ modalView: null, selectedAppointment: null });
  },

  setModalView: (view) => {
    set({ modalView: view });
  }
}));