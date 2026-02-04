import { create } from "zustand";
import type { Appointment } from "../types";

// ✅ Mantendo as definições de tipos consistentes
export type ModalView = "details" | "complete" | "cancel" | "decline" | "manual_booking";

interface AgendaModalState {
  modalView: ModalView | null;
  selectedAppointment: Appointment | null;
  modalData: {
    defaultDate?: Date;
  } | null;

  /**
   * Abre um modal. Parâmetros opcionais usam 'undefined' por padrão para satisfazer o TS.
   */
  openModal: (view: ModalView, appointment?: Appointment, data?: { defaultDate?: Date }) => void;
  
  closeModal: () => void;
  
  /**
   * Muda a visualização atual.
   */
  setModalView: (view: ModalView | null, appointment?: Appointment) => void;
}

export const useAgendaModalStore = create<AgendaModalState>((set) => ({
  modalView: null,
  selectedAppointment: null,
  modalData: null,

  // ✅ CORREÇÃO: Alterado de '= null' para '= undefined' para bater com o tipo 'Appointment | undefined'
  openModal: (view, appointment = undefined, data = undefined) => {
    set({ 
      modalView: view, 
      // O estado interno aceita 'null', então convertemos se vier undefined
      selectedAppointment: appointment ?? null, 
      modalData: data ?? null 
    });
  },
  
  closeModal: () => {
    set({ 
      modalView: null, 
      selectedAppointment: null, 
      modalData: null 
    });
  },

  setModalView: (view, appointment) => {
    set((state) => ({ 
      modalView: view,
      // Se um novo appointment for passado, usa ele, senão mantém o que já estava
      selectedAppointment: appointment !== undefined ? appointment : state.selectedAppointment
    }));
  }
}));