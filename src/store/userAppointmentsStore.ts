import { create } from "zustand";
import { useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp, // Essencial para a verificação de tipo
} from "firebase/firestore";
import type { Appointment as FirestoreAppointment } from "../types"; // Renomeia o tipo original
import { updateAppointmentStatus } from "../firebase/bookingService";

// ✅ MELHORIA: Cria um tipo interno para o frontend que usa objetos Date.
// Isso resolve o erro de tipagem e torna o uso nos componentes mais seguro.
export type AppAppointment = Omit<FirestoreAppointment, 'startTime' | 'endTime' | 'createdAt'> & {
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date | null;
};

/**
 * Interface para o estado dos agendamentos do usuário.
 */
interface UserAppointmentsState {
  bookings: AppAppointment[]; // Usa o novo tipo com Date
  loading: boolean;
  error: string | null;
  cancelBooking: (bookingId: string) => Promise<void>;
  // Adiciona a função de alteração de estado para uso interno no hook
  _setState: (partial: Partial<UserAppointmentsState>) => void;
}

/**
 * Store Zustand que gerencia o estado dos agendamentos (bookings).
 */
const useUserAppointmentsStore = create<UserAppointmentsState>((set) => ({
  bookings: [],
  loading: true,
  error: null,
  _setState: (partial) => set(partial),

  /**
   * Cancela um agendamento com uma abordagem de atualização otimista na UI.
   */
  cancelBooking: async (bookingId: string) => {
    const originalBookings = useUserAppointmentsStore.getState().bookings;
    const bookingToCancel = originalBookings.find((b) => b.id === bookingId);

    if (!bookingToCancel) {
      console.warn("Agendamento não encontrado para cancelar:", bookingId);
      return;
    }
    
    // Atualização Otimista: Muda o status na UI imediatamente para feedback instantâneo.
    const optimisticBookings = originalBookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    set({ bookings: optimisticBookings });

    try {
      await updateAppointmentStatus(bookingId, 'cancelled');
    } catch (error) {
      console.error("Falha ao cancelar agendamento no Firestore:", error);
      // Reverte a UI para o estado original em caso de erro na API.
      set({
        bookings: originalBookings,
        error: "Falha ao cancelar o agendamento. Tente novamente.",
      });
      // Lança o erro para que o componente possa exibir um toast, se desejar.
      throw error;
    }
  },
}));

/**
 * Hook customizado para ouvir os agendamentos de um usuário em tempo real.
 * Gerencia o ciclo de vida do listener do Firestore e popula o store de forma segura.
 * @param userId O ID do usuário para buscar os agendamentos.
 */
export const useUserAppointments = (userId?: string) => {
  const { _setState } = useUserAppointmentsStore.getState();

  useEffect(() => {
    // Se não houver usuário, limpa o estado e interrompe a execução.
    if (!userId) {
      _setState({ bookings: [], loading: false, error: null });
      return;
    }

    _setState({ loading: true });
    
    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", userId),
      orderBy("startTime", "desc") // Ordena pelos horários de início mais recentes
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        // ✅ CORREÇÃO DEFINITIVA: Processa os dados de forma segura.
        const userAppointments = querySnapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreAppointment;
          
          // Converte os Timestamps em objetos Date, tratando casos onde o campo pode não existir.
          const startTime = data.startTime instanceof Timestamp ? data.startTime.toDate() : null;
          const endTime = data.endTime instanceof Timestamp ? data.endTime.toDate() : null;
          const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;

          return {
            ...data,
            id: doc.id,
            startTime,
            endTime,
            createdAt,
          };
        });
        
        _setState({ bookings: userAppointments, loading: false, error: null });
      },
      (err) => {
        console.error("Erro no listener de agendamentos: ", err);
        _setState({ error: "Não foi possível carregar os agendamentos.", loading: false });
      }
    );

    // Função de limpeza: cancela o listener quando o componente desmonta ou o userId muda.
    return () => unsubscribe();
  }, [userId, _setState]);

  // Retorna o estado completo e reativo do store para o componente.
  return useUserAppointmentsStore();
};

