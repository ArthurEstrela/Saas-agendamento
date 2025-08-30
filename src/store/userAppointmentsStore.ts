import { create } from "zustand";
import { useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import type { Appointment } from "../types";
import { cancelBooking as cancelBookingInDb } from "../firebase/bookingService";

/**
 * Interface para o estado dos agendamentos de um usuário.
 * Gerencia a lista de agendamentos, status de carregamento e erros.
 */
interface UserAppointmentsState {
  bookings: Appointment[];
  loading: boolean;
  error: string | null;
  setBookings: (bookings: Appointment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  cancelBooking: (bookingId: string) => Promise<void>;
}

/**
 * Zustand store para gerenciar os agendamentos existentes de um usuário.
 */
const useUserAppointmentsStore = create<UserAppointmentsState>((set, get) => ({
  bookings: [],
  loading: true,
  error: null,
  setBookings: (bookings) => set({ bookings, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  /**
   * Cancela um agendamento com uma abordagem de atualização otimista.
   * A UI é atualizada imediatamente para "cancelled", e a chamada ao banco de dados é feita em seguida.
   * Em caso de falha, o estado da UI é revertido.
   */
  cancelBooking: async (bookingId: string) => {
    const currentBookings = get().bookings;
    const bookingToCancel = currentBookings.find((b) => b.id === bookingId);

    if (!bookingToCancel) {
      console.warn("Tentativa de cancelar um agendamento que não está no estado local.");
      return;
    }
    
    // Atualização Otimista
    const updatedBookings = currentBookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    set({ bookings: updatedBookings });

    try {
      // Chama o serviço para atualizar o Firestore
      await cancelBookingInDb(bookingId);
    } catch (error) {
      console.error("Falha ao cancelar o agendamento no Firestore:", error);
      // Reverte a UI em caso de erro
      set({
        bookings: currentBookings,
        error: "Falha ao cancelar o agendamento. Tente novamente.",
      });
    }
  },
}));

/**
 * Hook customizado para ouvir os agendamentos de um usuário em tempo real do Firestore.
 * @param userId - O ID do usuário para buscar os agendamentos.
 * @returns O estado dos agendamentos, incluindo a lista, status de carregamento, erros e a função de cancelamento.
 */
export const useUserAppointments = (userId?: string) => {
  const {
    bookings,
    loading,
    error,
    cancelBooking,
    setBookings,
    setLoading,
    setError,
  } = useUserAppointmentsStore();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setBookings([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", userId),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userAppointments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setBookings(userAppointments);
      },
      (err) => {
        console.error("Erro no listener de agendamentos: ", err);
        setError("Não foi possível carregar os agendamentos.");
      }
    );

    // Limpa o listener quando o componente é desmontado ou o userId muda
    return () => unsubscribe();
  }, [userId, setBookings, setLoading, setError]);

  return { bookings, loading, error, cancelBooking };
};

export default useUserAppointmentsStore;
