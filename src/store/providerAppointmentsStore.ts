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
import { toast } from "react-hot-toast"; // Importe o toast

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
  selectedAppointment: null,
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
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const appointmentsPromises = snapshot.docs.map(
          async (doc): Promise<EnrichedProviderAppointment> => {
            // 1. Pega os dados crus
            const rawData = doc.data();

            // 2. *** A CORREÇÃO ESTÁ AQUI ***
            // Primeiro, dizemos ao TS que 'rawData' bate com a 'Appointment'.
            // Isso "ensina" ao TS que 'clientId', 'status', etc., existem.
            const typedData = rawData as Appointment;

            // 3. Agora, montamos o objeto final,
            // substituindo os Timestamps pelas Datas corretas.
            const apptData: Appointment = {
              ...typedData, // Agora o TS sabe que 'clientId' está neste spread
              id: doc.id,
              startTime: (rawData.startTime as Timestamp).toDate(),
              endTime: (rawData.endTime as Timestamp).toDate(),
              createdAt: (rawData.createdAt as Timestamp).toDate(),
              completedAt:
                rawData.completedAt && rawData.completedAt instanceof Timestamp
                  ? rawData.completedAt.toDate()
                  : rawData.completedAt,
            };

            // 4. Agora esta linha funciona, pois apptData é do tipo Appointment
            const clientProfile = (await getUserProfile(
              apptData.clientId
            )) as ClientProfile | null;

            // 5. Retorna o objeto enriquecido
            return {
              ...apptData,
              client: clientProfile || undefined,
            };
          }
        );

        const enrichedAppointments = await Promise.all(appointmentsPromises);
        set({ appointments: enrichedAppointments, isLoading: false });
      },
      (error) => {
        console.error("Erro ao buscar agendamentos do prestador:", error);
        toast.error("Falha ao carregar agendamentos.");
        set({ isLoading: false });
      }
    );
    set({ unsubscribe });
  },

  completeAppointment: async (appointmentId, finalPrice) => {
    const promise = updateAppointmentStatus(
      appointmentId,
      "completed",
      finalPrice
    );

    toast.promise(promise, {
      loading: "Finalizando agendamento...",
      success: "Agendamento concluído com sucesso!",
      error: "Falha ao concluir agendamento.",
    });

    try {
      await promise;
      const providerId = get().appointments.find(
        (a) => a.id === appointmentId
      )?.providerId;

      const { dateFilter } = get();

      if (providerId) {
        useFinanceStore
          .getState()
          .fetchFinancialData(
            providerId,
            dateFilter.startDate,
            dateFilter.endDate
          );
      }
    } catch (error) {
      console.error("Erro ao concluir agendamento:", error);
    }
  },

  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),

  setDateFilter: (filter) => set({ dateFilter: filter }),
  setServiceFilter: (serviceId) => set({ serviceFilter: serviceId }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  updateStatus: async (appointmentId, status, finalPrice, rejectionReason) => {
    const promise = updateAppointmentStatus(
      appointmentId,
      status,
      finalPrice,
      rejectionReason
    );

    toast.promise(promise, {
      loading: "Atualizando status...",
      success: "Status atualizado com sucesso!",
      error: "Falha ao atualizar status.",
    });

    try {
      await promise;
      if (status === "completed") {
        const providerId = get().appointments.find(
          (a) => a.id === appointmentId
        )?.providerId;

        const { dateFilter } = get();

        if (providerId) {
          useFinanceStore
            .getState()
            .fetchFinancialData(
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

  setSelectedAppointment: (appointment) =>
    set({ selectedAppointment: appointment }),
}));
