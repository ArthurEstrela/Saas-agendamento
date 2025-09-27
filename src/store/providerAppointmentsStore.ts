// src/store/providerAppointmentsStore.ts
import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Appointment, ClientProfile } from "../types";
import { getUserProfile } from "../firebase/userService";
import { updateAppointmentStatus } from "../firebase/bookingService";
import { useFinanceStore } from "./financeStore";
import { startOfDay, endOfDay } from "date-fns";

export interface EnrichedProviderAppointment extends Appointment {
  client?: ClientProfile;
}

export type DateFilter = {
  startDate: Date;
  endDate: Date;
};

interface ProviderAppointmentsState {
  appointments: EnrichedProviderAppointment[];
  isLoading: boolean;
  selectedProfessionalId: string;
  dateFilter: DateFilter;
  // Adicionei os estados de filtro que faltavam na interface
  serviceFilter: string;
  statusFilter: Appointment["status"] | "all";
  unsubscribe: () => void;
  updateStatus: (
    appointmentId: string,
    status: Appointment["status"],
    finalPrice?: number,
    rejectionReason?: string
  ) => Promise<void>;
  selectedAppointment: EnrichedProviderAppointment | null;
  setSelectedAppointment: (
    appointment: EnrichedProviderAppointment | null
  ) => void;
}

interface ProviderAppointmentsActions {
  fetchAppointments: (providerId: string) => void;
  setSelectedProfessionalId: (id: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  setServiceFilter: (serviceId: string) => void;
  setStatusFilter: (status: Appointment["status"] | "all") => void;
  clearAppointments: () => void;
  completeAppointment: (
    appointmentId: string,
    finalPrice: number
  ) => Promise<void>;
}

const today = new Date();
const initialState = {
  appointments: [],
  isLoading: true,
  selectedProfessionalId: "all",
  dateFilter: { startDate: startOfDay(today), endDate: endOfDay(today) },
  serviceFilter: "all",
  statusFilter: "scheduled" as const,
  unsubscribe: () => {},
};

export const useProviderAppointmentsStore = create<
  ProviderAppointmentsState & ProviderAppointmentsActions
>((set, get) => ({
  ...initialState,

  fetchAppointments: (providerId) => {
    get().unsubscribe();
    set({ isLoading: true });

    const q = query(
      collection(db, "appointments"),
      where("providerId", "==", providerId),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const appointmentsPromises = snapshot.docs.map(
          async (doc): Promise<EnrichedProviderAppointment> => {
            const rawData = doc.data();
            // CORREÇÃO AQUI: A variável agora se chama 'apptData'
            const apptData = {
              id: doc.id,
              ...rawData,
              startTime: (rawData.startTime as Timestamp).toDate(),
              endTime: (rawData.endTime as Timestamp).toDate(),
            } as Appointment;

            const clientProfile = (await getUserProfile(
              apptData.clientId
            )) as ClientProfile | null;

            return { ...apptData, client: clientProfile || undefined };
          }
        );

        const enrichedAppointments = await Promise.all(appointmentsPromises);
        set({ appointments: enrichedAppointments, isLoading: false });
      },
      (error) => {
        console.error("Erro ao buscar agendamentos do prestador:", error);
        set({ isLoading: false });
      }
    );
    set({ unsubscribe });
  },

completeAppointment: async (appointmentId, finalPrice) => {
    set({ isLoading: true });
    try {
      await updateAppointmentStatus(appointmentId, "completed", finalPrice);
      const providerId = get().appointments.find(
        (a) => a.id === appointmentId
      )?.providerId;
      
      // >>> CORREÇÃO: Pega o dateFilter da store atual
      const { dateFilter } = get();
      
      if (providerId) {
        // >>> CORREÇÃO: Chama com os 3 argumentos
        useFinanceStore.getState().fetchFinancialData(
          providerId,
          dateFilter.startDate,
          dateFilter.endDate 
        );
      }
    } catch (error) {
      console.error("Erro ao concluir agendamento:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),

  // Novas ações de filtro
  setDateFilter: (filter) => set({ dateFilter: filter }),
  setServiceFilter: (serviceId) => set({ serviceFilter: serviceId }),
  setStatusFilter: (status) => set({ statusFilter: status }),

 updateStatus: async (appointmentId, status, finalPrice, rejectionReason) => {
    // Sua lógica existente... (sem alterações)
    try {
      await updateAppointmentStatus(
        appointmentId,
        status,
        finalPrice,
        rejectionReason
      );
      if (status === "completed") {
        const providerId = get().appointments.find(
          (a) => a.id === appointmentId
        )?.providerId;
        
        // >>> CORREÇÃO: Pega o dateFilter da store atual
        const { dateFilter } = get();

        if (providerId) {
          // >>> CORREÇÃO: Chama com os 3 argumentos
          useFinanceStore.getState().fetchFinancialData(
            providerId,
            dateFilter.startDate,
            dateFilter.endDate
          );
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
    }
  },

  clearAppointments: () => {
    get().unsubscribe();
    set(initialState);
  },
  selectedAppointment: null,
  setSelectedAppointment: (appointment) =>
    set({ selectedAppointment: appointment }),
}));
