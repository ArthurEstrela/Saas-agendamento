import { create } from "zustand";
import type { Appointment } from "../types";

export type ModalView = "details" | "complete" | "cancel" | "decline" | "manual_booking";

interface ModalDataPayload {
  selectedDate?: Date;
  selectedTime?: string;
  [key: string]: unknown; // Permite passar outros dados extras sem usar o perigoso 'any'
}

interface AgendaModalState {
  // Estado
  modalView: ModalView | null;
  selectedAppointment: Appointment | null;
  modalData: ModalDataPayload;

  // Ações
  openModal: (view: ModalView, appointment?: Appointment | null, data?: ModalDataPayload) => void;
  closeModal: () => void;
  setModalData: (data: Partial<ModalDataPayload>) => void;
}

export const useAgendaModalStore = create<AgendaModalState>((set) => ({
  // Estado Inicial
  modalView: null,
  selectedAppointment: null,
  modalData: {},

  // ==========================================================================
  // 1. ABRIR UM MODAL
  // ==========================================================================
  openModal: (view, appointment = null, data = {}) => 
    set({ 
      modalView: view, 
      selectedAppointment: appointment, 
      modalData: data 
    }),

  // ==========================================================================
  // 2. FECHAR O MODAL E LIMPAR OS DADOS TEMPORÁRIOS
  // ==========================================================================
  closeModal: () => 
    set({ 
      modalView: null, 
      selectedAppointment: null, 
      modalData: {} 
    }),

  // ==========================================================================
  // 3. ATUALIZAR DADOS DENTRO DO MODAL ABERTO
  // ==========================================================================
  setModalData: (data) => 
    set((state) => ({ 
      modalData: { ...state.modalData, ...data } 
    })),
}));