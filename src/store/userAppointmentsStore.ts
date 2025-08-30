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
// 1. CORREÇÃO: Importa a função com o nome correto.
import { updateAppointmentStatus } from "../firebase/bookingService";

/**
 * Interface para o estado dos agendamentos de um usuário.
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
   */
  cancelBooking: async (bookingId: string) => {
    const currentBookings = get().bookings;
    const bookingToCancel = currentBookings.find((b) => b.id === bookingId);

    if (!bookingToCancel) {
      console.warn("Agendamento não encontrado para cancelar.");
      return;
    }
    
    // Atualização Otimista: Muda o status na UI imediatamente.
    const optimisticBookings = currentBookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    set({ bookings: optimisticBookings });

    try {
      // 2. CORREÇÃO: Chama a função correta do bookingService, passando o novo status.
      await updateAppointmentStatus(bookingId, 'cancelled');
    } catch (error) {
      console.error("Falha ao cancelar o agendamento no Firestore:", error);
      // Reverte a UI em caso de erro.
      set({
        bookings: currentBookings,
        error: "Falha ao cancelar o agendamento. Tente novamente.",
      });
    }
  },
}));

/**
 * Hook customizado para ouvir os agendamentos de um usuário em tempo real.
 */
export const useUserAppointments = (userId?: string) => {
  const store = useUserAppointmentsStore();

  useEffect(() => {
    if (!userId) {
      store.setLoading(false);
      store.setBookings([]);
      return;
    }

    store.setLoading(true);
    const q = query(
      collection(db, "appointments"), // CORREÇÃO: A coleção correta é 'appointments'
      where("clientId", "==", userId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userAppointments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        store.setBookings(userAppointments);
      },
      (err) => {
        console.error("Erro no listener de agendamentos: ", err);
        store.setError("Não foi possível carregar os agendamentos.");
      }
    );

    return () => unsubscribe();
  }, [userId, store.setBookings, store.setLoading, store.setError]);

  return store;
};