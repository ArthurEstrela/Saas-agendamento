import { create } from "zustand";
import { useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Appointment as FirestoreAppointment } from "../types";
import { updateAppointmentStatus } from "../firebase/bookingService";

export type AppAppointment = Omit<FirestoreAppointment, 'startTime' | 'endTime' | 'createdAt'> & {
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date | null;
};

interface UserAppointmentsState {
  allBookings: AppAppointment[];
  loading: boolean;
  error: string | null;
  cancelBooking: (bookingId: string) => Promise<void>;
  _setState: (partial: Partial<Omit<UserAppointmentsState, 'cancelBooking'>>) => void;
}

const useUserAppointmentsStore = create<UserAppointmentsState>((set) => ({
  allBookings: [],
  loading: true,
  error: null,
  _setState: (partial) => set(partial),

  cancelBooking: async (bookingId: string) => {
    const originalBookings = useUserAppointmentsStore.getState().allBookings;
    const optimisticBookings = originalBookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    set({ allBookings: optimisticBookings });

    try {
      await updateAppointmentStatus(bookingId, 'cancelled');
    } catch (error) {
      console.error("Falha ao cancelar agendamento no Firestore:", error);
      set({
        allBookings: originalBookings,
        error: "Falha ao cancelar o agendamento. Tente novamente.",
      });
      throw error;
    }
  },
}));

export const useUserAppointments = (userId?: string) => {
  const { allBookings, loading, error, cancelBooking } = useUserAppointmentsStore();
  const { _setState } = useUserAppointmentsStore.getState();

  useEffect(() => {
    if (!userId) {
      _setState({ allBookings: [], loading: false, error: null });
      return;
    }
    _setState({ loading: true });

    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const processedBookings = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreAppointment;
        return {
          ...data,
          id: doc.id,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : null,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
        };
      });
      _setState({ allBookings: processedBookings, loading: false, error: null });
    }, (err) => {
      console.error("Erro no listener de agendamentos:", err);
      _setState({ error: "Não foi possível carregar os agendamentos.", loading: false });
    });

    return () => unsubscribe();
  }, [userId, _setState]);
  
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const validBookings = allBookings.filter(b => b.startTime instanceof Date);

    // ✅ CORREÇÃO: A classificação agora é baseada apenas no STATUS.
    // "Próximos" são agendamentos que requerem atenção (pendentes ou confirmados).
    const upcoming = validBookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed'
    );

    // "Histórico" são agendamentos que estão finalizados (concluídos ou cancelados).
    const past = validBookings.filter(b => 
      b.status === 'completed' || b.status === 'cancelled'
    );

    // Ordena os próximos do mais perto para o mais longe.
    upcoming.sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());
    // Ordena o histórico do mais recente para o mais antigo.
    past.sort((a, b) => b.startTime!.getTime() - a.startTime!.getTime());

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [allBookings]);

  return { loading, error, upcomingBookings, pastBookings, cancelBooking };
};

