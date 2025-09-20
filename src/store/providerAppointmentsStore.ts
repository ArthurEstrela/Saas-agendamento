// src/store/providerAppointmentsStore.ts
import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Appointment, ClientProfile } from "../types";
import { getUserProfile } from "../firebase/userService";
import { updateAppointmentStatus } from "../firebase/bookingService";
import { useFinanceStore } from "./financeStore";

export interface EnrichedProviderAppointment extends Appointment {
  client?: ClientProfile;
}

interface ProviderAppointmentsState {
  appointments: EnrichedProviderAppointment[];
  isLoading: boolean;
  selectedProfessionalId: string;
  unsubscribe: () => void;
  updateStatus: (
    appointmentId: string,
    status: Appointment["status"],
    finalPrice?: number,
    rejectionReason?: string
  ) => Promise<void>;
}

interface ProviderAppointmentsActions {
  fetchAppointments: (providerId: string) => void;
  setSelectedProfessionalId: (id: string) => void;
  clearAppointments: () => void;
  completeAppointment: (
    appointmentId: string,
    finalPrice: number
  ) => Promise<void>; // Adicione esta linha se não existir
}

const initialState = {
  appointments: [],
  isLoading: true,
  selectedProfessionalId: "all",
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
            const apptData = {
              id: doc.id,
              ...doc.data(),
              startTime: doc.data().startTime.toDate(),
              endTime: doc.data().endTime.toDate(),
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

      // AVISO PARA ATUALIZAR AS FINANÇAS!
      // Pegamos o ID do provedor do agendamento que acabamos de concluir
      const providerId = get().appointments.find(
        (a) => a.id === appointmentId
      )?.providerId;
      if (providerId) {
        // Chamamos a função da financeStore para buscar os dados novos
        useFinanceStore.getState().fetchFinancialData(providerId);
      }
    } catch (error) {
      console.error("Erro ao concluir agendamento:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),

  updateStatus: async (appointmentId, status, finalPrice, rejectionReason) => {
    try {
      await updateAppointmentStatus(
        appointmentId,
        status,
        finalPrice,
        rejectionReason
      );

      // Se o serviço foi concluído, atualiza os dados financeiros!
      if (status === "completed") {
        const providerId = get().appointments.find(
          (a) => a.id === appointmentId
        )?.providerId;
        if (providerId) {
          useFinanceStore.getState().fetchFinancialData(providerId);
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
}));
