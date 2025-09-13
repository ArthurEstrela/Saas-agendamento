// Em: src/store/providerAppointmentsStore.ts
import { create } from 'zustand';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Appointment, ClientProfile } from '../types';
import { getUserProfile } from '../firebase/userService';
// Usando a sua função, que é mais completa
import { updateAppointmentStatus } from '../firebase/bookingService';

export interface EnrichedProviderAppointment extends Appointment {
  client?: ClientProfile;
}

interface ProviderAppointmentsState {
  appointments: EnrichedProviderAppointment[];
  isLoading: boolean;
  selectedProfessionalId: string;
  unsubscribe: () => void;
  // Assinatura atualizada para incluir o motivo da recusa
  updateStatus: (appointmentId: string, status: Appointment['status'], rejectionReason?: string) => Promise<void>;
}

interface ProviderAppointmentsActions {
  fetchAppointments: (providerId: string) => void;
  setSelectedProfessionalId: (id: string) => void;
  clearAppointments: () => void;
}

const initialState = {
  appointments: [],
  isLoading: true,
  selectedProfessionalId: 'all',
  unsubscribe: () => {},
};

export const useProviderAppointmentsStore = create<ProviderAppointmentsState & ProviderAppointmentsActions>((set, get) => ({
  ...initialState,

  fetchAppointments: (providerId) => {
    get().unsubscribe();
    set({ isLoading: true });

    const q = query(
      collection(db, "appointments"),
      where("providerId", "==", providerId),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const appointmentsPromises = snapshot.docs.map(async (doc): Promise<EnrichedProviderAppointment> => {
        const apptData = {
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
        } as Appointment;

        const clientProfile = await getUserProfile(apptData.clientId) as ClientProfile | null;

        return { ...apptData, client: clientProfile || undefined };
      });

      const enrichedAppointments = await Promise.all(appointmentsPromises);
      set({ appointments: enrichedAppointments, isLoading: false });
    }, (error) => {
      console.error("Erro ao buscar agendamentos do prestador:", error);
      set({ isLoading: false });
    });

    set({ unsubscribe });
  },

  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),

  // Função ajustada para usar a sua bookingService
  updateStatus: async (appointmentId, status, rejectionReason) => {
    try {
      await updateAppointmentStatus(appointmentId, status, rejectionReason);
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
    }
  },

  clearAppointments: () => {
    get().unsubscribe();
    set(initialState);
  },
}));