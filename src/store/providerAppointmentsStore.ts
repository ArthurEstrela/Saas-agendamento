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
import { startOfMonth, startOfDay, endOfDay } from "date-fns";
import { toast } from "react-hot-toast";

export interface EnrichedProviderAppointment extends Appointment {
  client?: ClientProfile;
}

// Helper para tratar datas do Firestore de forma segura
interface FirestoreAppointmentData extends Omit<Appointment, 'startTime' | 'endTime' | 'createdAt' | 'completedAt'> {
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
}

export type DateFilter = {
  startDate: Date;
  endDate: Date;
};

interface ProviderAppointmentsState {
  appointments: EnrichedProviderAppointment[];
  isLoading: boolean;
  currentProviderId: string | null;
  selectedProfessionalId: string;
  // Mantemos o dateFilter para saber qual dia o usuário selecionou no calendário (visual),
  // mas a busca no banco será mais ampla.
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
  completeAppointment: (appointmentId: string, finalPrice: number) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason: string) => Promise<void>;
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

    // --- ESTRATÉGIA TOP ---
    // Pegamos a data que o usuário selecionou (ex: hoje)
    const { dateFilter } = get();

    // Mas buscamos no banco desde o PRIMEIRO DIA DO MÊS ATUAL
    // Motivo: Mostrar histórico recente e permitir navegação rápida no calendário.
    const startOfCurrentMonth = startOfMonth(dateFilter.startDate);
    const startTimestamp = Timestamp.fromDate(startOfCurrentMonth);

    // NÃO usamos 'endTimestamp'.
    // Motivo: Queremos ver TODAS as solicitações futuras (mesmo do mês que vem).
    const q = query(
      collection(db, "appointments"),
      where("providerId", "==", providerId),
      where("startTime", ">=", startTimestamp), // Do dia 1º pra frente...
      orderBy("startTime", "asc") // ...até o infinito, ordenado.
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const appointmentsPromises = snapshot.docs.map(
            async (doc): Promise<EnrichedProviderAppointment> => {
              const rawData = doc.data() as FirestoreAppointmentData;

              const toDate = (val: unknown): Date => {
                if (val instanceof Timestamp) return val.toDate();
                return new Date();
              };

              const apptData: Appointment = {
                ...rawData,
                id: doc.id,
                startTime: toDate(rawData.startTime),
                endTime: toDate(rawData.endTime),
                createdAt: toDate(rawData.createdAt),
                completedAt: rawData.completedAt ? toDate(rawData.completedAt) : undefined,
              };

              let clientProfile: ClientProfile | null = null;
              if (apptData.clientId) {
                try {
                  clientProfile = (await getUserProfile(apptData.clientId)) as ClientProfile | null;
                } catch { 
                  // CORREÇÃO AQUI: Removido o '(e)' já que o erro é intencionalmente ignorado
                  // Silencioso para não poluir console se cliente foi deletado
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
          console.error("Erro ao processar agendamentos:", err);
          set({ isLoading: false });
        }
      },
      (error) => {
        console.error("Erro no listener:", error);
        // O erro de índice vai aparecer na primeira vez porque mudamos a query
        if (error.message.includes("index")) {
          console.error("⚠️ CLIQUE NO LINK DO CONSOLE PARA CRIAR O ÍNDICE: providerId + startTime (ASC)");
        }
        toast.error("Falha ao carregar agenda.");
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },

  setDateFilter: (filter) => {
    // Quando o usuário muda a data no calendário...
    const oldFilter = get().dateFilter;
    set({ dateFilter: filter });

    const { currentProviderId, fetchAppointments } = get();

    // LÓGICA INTELIGENTE:
    // Só recarregamos do banco se o usuário mudou de MÊS.
    // Se ele só mudou de dia dentro do mesmo mês, os dados já estão na memória (estratégia Top).
    if (currentProviderId) {
      const oldMonth = startOfMonth(oldFilter.startDate).getTime();
      const newMonth = startOfMonth(filter.startDate).getTime();

      if (oldMonth !== newMonth) {
        fetchAppointments(currentProviderId);
      }
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
      success: "Concluído!",
      error: "Erro ao concluir.",
    });

    try {
      await promise;
      // Atualiza financeiro
      const { currentProviderId, dateFilter } = get();
      if (currentProviderId) {
        useFinanceStore.getState().fetchFinancialData(currentProviderId, dateFilter.startDate);
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
        toast.error("Preço final obrigatório.");
        return;
      }
      await get().completeAppointment(appointmentId, finalPrice);
      return;
    }
    const promise = updateAppointmentStatus(appointmentId, status, rejectionReason);
    await toast.promise(promise, {
      loading: "Atualizando...",
      success: "Status atualizado!",
      error: "Erro ao atualizar.",
    });
  },
}));