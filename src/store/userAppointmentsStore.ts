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
import type { Appointment, ServiceProviderProfile } from "../types";
import { getUserProfile } from "../firebase/userService";

export interface EnrichedAppointment extends Appointment {
  provider?: ServiceProviderProfile;
  professionalPhotoUrl?: string;
}

interface UserAppointmentsState {
  appointments: EnrichedAppointment[];
  isLoading: boolean;
  error: string | null;
  unsubscribe: () => void;
}

interface UserAppointmentsActions {
  fetchAppointments: (userId: string) => void;
  clearAppointments: () => void;
}

const initialState: Omit<UserAppointmentsState, "unsubscribe"> = {
  appointments: [],
  isLoading: true,
  error: null,
};

export const useUserAppointmentsStore = create<
  UserAppointmentsState & UserAppointmentsActions
>((set, get) => ({
  ...initialState,
  unsubscribe: () => {},

  fetchAppointments: (userId) => {
    set({ isLoading: true });

    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", userId),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const appointmentsPromises = querySnapshot.docs.map(
          async (doc): Promise<EnrichedAppointment> => {
            const data = doc.data();
            const appointmentData = {
              id: doc.id,
              ...data,
              // Adiciona verificação para evitar erro se startTime/endTime não existirem
              startTime: (data.startTime as Timestamp)?.toDate(),
              endTime: (data.endTime as Timestamp)?.toDate(),
            } as Appointment;

            // ================== AQUI ESTÁ A CORREÇÃO ==================
            // Verifica se providerId existe antes de tentar buscar o perfil
            if (appointmentData.providerId) {
              const providerProfile = (await getUserProfile(
                appointmentData.providerId
              )) as ServiceProviderProfile | null;
              const professionalPhotoUrl = providerProfile?.professionals?.find(
                (p) => p.id === appointmentData.professionalId
              )?.photoURL;

              return {
                ...appointmentData,
                provider: providerProfile || undefined,
                professionalPhotoUrl: professionalPhotoUrl || undefined,
              };
            } else {
              // Se não houver providerId, retorna o agendamento sem os dados extras
              console.warn(
                `Agendamento com ID ${appointmentData.id} está sem providerId.`
              );
              return appointmentData;
            }
            // ==========================================================
          }
        );

        const enrichedAppointments = await Promise.all(appointmentsPromises);
        set({
          appointments: enrichedAppointments,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error("Erro ao buscar agendamentos: ", error);
        set({
          isLoading: false,
          error: "Não foi possível carregar os agendamentos.",
        });
      }
    );

    set({ unsubscribe });
  },

  clearAppointments: () => {
    get().unsubscribe();
    set(initialState);
  },
}));
