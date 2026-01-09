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
import {
  updateAppointmentStatus,
  completeAppointment as completeAppointmentService,
} from "../firebase/bookingService";
import { useFinanceStore } from "./financeStore";
import { startOfDay, endOfDay } from "date-fns";
import { toast } from "react-hot-toast";

export interface EnrichedProviderAppointment extends Appointment {
  client?: ClientProfile;
}

export type DateFilter = {
  startDate: Date;
  endDate: Date;
};

// Tipo auxiliar para representar os dados "crus" vindos do Firestore
// (Lá as datas são Timestamp, não Date)
interface FirestoreAppointmentData extends Omit<Appointment, 'startTime' | 'endTime' | 'createdAt' | 'completedAt'> {
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
}

interface ProviderAppointmentsState {
  appointments: EnrichedProviderAppointment[];
  isLoading: boolean;
  currentProviderId: string | null;
  selectedProfessionalId: string;
  dateFilter: DateFilter;
  serviceFilter: string;
  statusFilter: Appointment["status"] | "all";
  selectedAppointment: EnrichedProviderAppointment | null;
}

interface ProviderAppointmentsActions {
  fetchAppointments: (providerId: string) => void;
  unsubscribe: () => void;
  setSelectedProfessionalId: (id: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  setServiceFilter: (serviceId: string) => void;
  setStatusFilter: (status: Appointment["status"] | "all") => void;
  clearAppointments: () => void;
  setSelectedAppointment: (appointment: EnrichedProviderAppointment | null) => void;

  completeAppointment: (
    appointmentId: string,
    finalPrice: number
  ) => Promise<void>;

  cancelAppointment: (
    appointmentId: string,
    reason: string
  ) => Promise<void>;

  updateStatus: (
    appointmentId: string,
    status: Appointment["status"],
    finalPrice?: number,
    rejectionReason?: string
  ) => Promise<void>;
}

const today = new Date();

const initialState: ProviderAppointmentsState = {
  appointments: [],
  isLoading: false,
  currentProviderId: null,
  selectedProfessionalId: "all",
  dateFilter: { startDate: startOfDay(today), endDate: endOfDay(today) },
  serviceFilter: "all",
  statusFilter: "scheduled",
  selectedAppointment: null,
};

export const useProviderAppointmentsStore = create<
  ProviderAppointmentsState & ProviderAppointmentsActions
>((set, get) => ({
  ...initialState,

  unsubscribe: () => {},

  fetchAppointments: (providerId) => {
    get().unsubscribe();

    set({ isLoading: true, currentProviderId: providerId });

    const q = query(
      collection(db, "appointments"),
      where("providerId", "==", providerId),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const appointmentsPromises = snapshot.docs.map(
            async (doc): Promise<EnrichedProviderAppointment> => {
              // 1. Casting seguro: dizemos ao TS que os dados seguem a estrutura do FirestoreAppointmentData
              const rawData = doc.data() as FirestoreAppointmentData;

              // 2. Função auxiliar tipada com 'unknown' em vez de 'any'
              const toDate = (val: unknown): Date => {
                if (val instanceof Timestamp) {
                  return val.toDate();
                }
                // Fallback de segurança caso venha algo inesperado
                return new Date();
              };

              // 3. Conversão explícita
              const apptData: Appointment = {
                // Espalhamos as propriedades que não são datas
                ...rawData,
                // Sobrescrevemos as datas convertendo Timestamp -> Date
                id: doc.id,
                startTime: toDate(rawData.startTime),
                endTime: toDate(rawData.endTime),
                createdAt: toDate(rawData.createdAt),
                // completedAt pode ser null/undefined, tratamos separadamente
                completedAt: rawData.completedAt 
                  ? toDate(rawData.completedAt) 
                  : undefined,
              };

              let clientProfile: ClientProfile | null = null;
              if (apptData.clientId) {
                try {
                  clientProfile = (await getUserProfile(apptData.clientId)) as ClientProfile | null;
                } catch (e) {
                  console.warn(`Erro ao buscar perfil do cliente ${apptData.clientId}`, e);
                }
              }

              return {
                ...apptData,
                client: clientProfile || undefined,
              };
            }
          );

          const enrichedAppointments = await Promise.all(appointmentsPromises);

          set({ appointments: enrichedAppointments, isLoading: false });
        } catch (err) {
          console.error("Erro ao processar snapshot de agendamentos:", err);
          set({ isLoading: false });
        }
      },
      (error) => {
        console.error("Erro no listener de agendamentos:", error);
        if (error.message.includes("index")) {
          console.error("⚠️ FALTA ÍNDICE NO FIRESTORE: Crie um índice composto para 'providerId' + 'startTime'");
        }
        toast.error("Falha ao carregar agendamentos.");
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },

  setDateFilter: (filter) => {
    set({ dateFilter: filter });
    const { currentProviderId, fetchAppointments } = get();
    if (currentProviderId) {
      fetchAppointments(currentProviderId);
    }
  },

  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),
  setServiceFilter: (serviceId) => set({ serviceFilter: serviceId }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),

  clearAppointments: () => {
    get().unsubscribe();
    set(initialState);
  },

  completeAppointment: async (appointmentId, finalPrice) => {
    const currentAppointment = get().appointments.find((a) => a.id === appointmentId);

    if (currentAppointment) {
      const now = new Date();
      const endTime = new Date(currentAppointment.endTime);
      if (now < endTime) {
        toast.error("Aguarde o término do horário para concluir.");
        return;
      }
    }

    const promise = completeAppointmentService(appointmentId, finalPrice);

    await toast.promise(promise, {
      loading: "Finalizando...",
      success: "Concluído com sucesso!",
      error: "Erro ao concluir.",
    });

    try {
      await promise;
      const { currentProviderId, dateFilter } = get();
      if (currentProviderId) {
        useFinanceStore.getState().fetchFinancialData(
          currentProviderId,
          dateFilter.startDate
        );
      }
    } catch (error) {
      console.error(error);
    }
  },

  cancelAppointment: async (appointmentId, reason) => {
    const promise = updateAppointmentStatus(appointmentId, "cancelled", reason);

    await toast.promise(promise, {
      loading: "Cancelando...",
      success: "Agendamento cancelado.",
      error: "Erro ao cancelar.",
    });
  },

  updateStatus: async (appointmentId, status, finalPrice, rejectionReason) => {
    if (status === "completed") {
      if (finalPrice === undefined) {
        toast.error("Preço final é obrigatório.");
        return;
      }
      await get().completeAppointment(appointmentId, finalPrice);
      return;
    }

    const promise = updateAppointmentStatus(appointmentId, status, rejectionReason);

    await toast.promise(promise, {
      loading: "Atualizando status...",
      success: "Status atualizado!",
      error: "Erro ao atualizar.",
    });
  },
}));