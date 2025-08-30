import { create } from "zustand";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useEffect } from "react";
import type { Appointment } from "../types";

// 1. Importe as FUNÇÕES do seu service!
import { cancelBooking as cancelBookingInDb } from "../firebase/bookingService";

interface BookingState {
  bookings: Appointment[];
  loading: boolean;
  error: string | null;
  setBookings: (bookings: Appointment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  cancelBooking: (bookingId: string) => Promise<void>;
}

// Usando a técnica de "Atualização Otimista" para a melhor experiência do usuário
const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: true,
  error: null,
  setBookings: (bookings) => set({ bookings, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // 2. A função cancelBooking agora USA o service e atualiza a UI na hora
  cancelBooking: async (bookingId: string) => {
    const currentBookings = get().bookings;
    const bookingToCancel = currentBookings.find((b) => b.id === bookingId);

    // Se o agendamento nem existe na lista local, não faz nada.
    if (!bookingToCancel) {
      console.warn(
        "Tentativa de cancelar um agendamento que não está no estado local."
      );
      return;
    }

    // Atualização Otimista (a tela atualiza na hora)
    const updatedBookings = currentBookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    set({ bookings: updatedBookings });

    try {
      // Chama a função do service para fazer o trabalho no banco de dados
      await cancelBookingInDb(bookingId);
      // Se deu certo, ótimo. O onSnapshot vai confirmar o estado.
    } catch (error: any) {
      // Captura o erro
      console.error("Falha ao cancelar no DB:", error);

      // Verifica se o erro é porque o documento não foi encontrado
      if (error.message.includes("No document to update")) {
        console.warn("O agendamento já havia sido removido do Firestore.");
        // O estado local já foi atualizado otimisticamente,
        // e o listener onSnapshot vai remover o item fantasma de qualquer forma.
        // A gente só precisa remover o erro da tela.
        set({ error: null });
      } else {
        // Se foi outro erro (como falta de internet), desfazemos a mudança na tela
        set({
          bookings: currentBookings,
          error: "Falha ao cancelar o agendamento.",
        });
      }
    }
  },
}));

// 3. REMOVA a função addBooking daqui. O lugar dela é só no bookingService.ts
// Quem for usar o addBooking deve importar diretamente do service.

// O hook useBookings continua perfeito, não precisa mudar nada nele!
export const useBookings = (userId?: string) => {
  const {
    bookings,
    loading,
    error,
    cancelBooking,
    setBookings,
    setLoading,
    setError,
  } = useBookingStore();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
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

    return () => unsubscribe();
  }, [userId, setBookings, setLoading, setError]);

  return { bookings, loading, error, cancelBooking };
};

export default useBookingStore;
