import { create } from "zustand";
import { useEffect } from "react";
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

// ✅ CORREÇÃO: A palavra 'export' é essencial aqui.
// Ela torna o tipo 'AppAppointment' visível e importável por outros arquivos no projeto.
// Sem ela, o tipo existe apenas dentro deste arquivo, causando o erro de "does not provide an export".
export type AppAppointment = Omit<FirestoreAppointment, 'startTime' | 'endTime' | 'createdAt'> & {
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date | null;
};

interface ProviderAppointmentsState {
  allAppointments: AppAppointment[];
  loading: boolean;
  error: string | null;
  _setState: (partial: Partial<Omit<ProviderAppointmentsState, '_setState'>>) => void;
}

const useProviderAppointmentsStore = create<ProviderAppointmentsState>((set) => ({
  allAppointments: [],
  loading: true,
  error: null,
  _setState: (partial) => set(partial),
}));

export const useProviderAppointments = (providerId?: string) => {
  const state = useProviderAppointmentsStore();
  const { _setState } = useProviderAppointmentsStore.getState();

  useEffect(() => {
    if (!providerId) {
      _setState({ allAppointments: [], loading: false, error: null });
      return;
    }
    _setState({ loading: true });

    const q = query(
      collection(db, "appointments"),
      where("serviceProviderId", "==", providerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const processedAppointments = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreAppointment;
        return {
          ...data,
          id: doc.id,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : null,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
        }
      });
      _setState({ allAppointments: processedAppointments, loading: false, error: null });
    }, (err) => {
      console.error("Erro no listener de agendamentos do prestador:", err);
      _setState({ error: "Não foi possível carregar a agenda.", loading: false });
    });

    return () => unsubscribe();
  }, [providerId, _setState]);

  return state;
};

