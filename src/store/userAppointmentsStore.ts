import { create } from "zustand";
import { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import type { Appointment, PagedResult } from "../types";
import { api } from "../lib/api";

// Extrator de mensagens adaptado para o padrão ProblemDetail (RFC 7807) do Spring Boot
const extractErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      defaultMessage
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// Tipagem para as métricas financeiras que a API retorna junto com o histórico
interface ClientHistoryMetrics {
  averageTicket: number;
  topServices: Array<{ name: string; count: number }>;
  favoriteProfessionals: Array<{ name: string; count: number }>;
}

// Tipagem da resposta real da nova rota do Java
interface ClientHistoryResponse {
  history: PagedResult<Appointment>;
  averageTicket: number;
  topServices: Array<{ name: string; count: number }>;
  favoriteProfessionals: Array<{ name: string; count: number }>;
}

interface UserAppointmentsState {
  appointments: Appointment[];
  metrics: ClientHistoryMetrics | null;
  loading: boolean;
  error: string | null;

  // Ações
  fetchUserAppointments: () => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  clearError: () => void;
}

export const useUserAppointmentsStore = create<UserAppointmentsState>(
  (set) => ({
    appointments: [],
    metrics: null,
    loading: false,
    error: null,

    // ==========================================================================
    // 1. BUSCAR O HISTÓRICO E AGENDAMENTOS FUTUROS DO CLIENTE
    // ==========================================================================
    fetchUserAppointments: async () => {
      set({ loading: true, error: null });
      try {
        // O backend extrai o ID de forma 100% segura usando o Token JWT
        const response = await api.get<ClientHistoryResponse>(
          "/clients/history",
          {
            params: {
              page: 0,
              size: 50, // Busca os últimos 50 agendamentos (ajuste a paginação conforme precisar no futuro)
            },
          },
        );

        const { history, averageTicket, topServices, favoriteProfessionals } =
          response.data;

        set({
          appointments: history.items,
          metrics: {
            averageTicket,
            topServices,
            favoriteProfessionals,
          },
          loading: false,
        });
      } catch (error) {
        set({
          error: extractErrorMessage(
            error,
            "Erro ao carregar seus agendamentos.",
          ),
          loading: false,
        });
      }
    },

    // ==========================================================================
    // 2. CANCELAR AGENDAMENTO (CLIENTE)
    // ==========================================================================
    cancelAppointment: async (appointmentId: string, reason?: string) => {
      set({ loading: true, error: null });
      try {
        // De acordo com o CancelAppointmentUseCase.java, é um DELETE que recebe a "reason" como parâmetro
        await api.delete(`/appointments/${appointmentId}`, {
          params: {
            reason: reason || "Cancelado pelo cliente no app",
          },
        });

        // Atualização otimista da UI (Evita precisar fazer um novo fetch logo em seguida)
        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  status: "CANCELLED",
                  rejectionReason: reason || "Cancelado pelo cliente",
                }
              : apt,
          ),
          loading: false,
        }));

        toast.success("Agendamento cancelado com sucesso.");
      } catch (error) {
        const errorMessage = extractErrorMessage(
          error,
          "Não foi possível cancelar o agendamento.",
        );
        set({ error: errorMessage, loading: false });
        toast.error(errorMessage);
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  }),
);
