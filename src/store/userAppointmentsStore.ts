import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type {
  Appointment,
  ServiceProviderProfile,
  Professional,
} from "../types";
import { getUserProfile } from "../firebase/userService";
import { toast } from "react-hot-toast";
import { cancelAppointmentSecurely } from '../firebase/bookingService';

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
  cancelAppointment: (appointmentId: string, reason: string) => Promise<void>;
}

const initialState: Omit<UserAppointmentsState, "unsubscribe"> = {
  appointments: [],
  isLoading: true,
  error: null,
};

const fetchProfessionalPhotoUrl = async (
  providerId: string,
  professionalId: string
): Promise<string | undefined> => {
  try {
    const professionalRef = doc(
      db,
      "users",
      providerId,
      "professionals",
      professionalId
    );
    const professionalSnap = await getDoc(professionalRef);

    if (professionalSnap.exists()) {
      const professionalData = professionalSnap.data() as Professional;
      return professionalData.photoURL;
    }
    return undefined;
  } catch (error) {
    console.error("Erro ao buscar foto do profissional na sub-coleção:", error);
    return undefined;
  }
};

export const useUserAppointmentsStore = create<
  UserAppointmentsState & UserAppointmentsActions
>((set, get) => ({
  ...initialState,
  unsubscribe: () => {},

  fetchAppointments: (userId) => {
    set({ isLoading: true });
    get().unsubscribe();

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
              startTime: (data.startTime as Timestamp)?.toDate(),
              endTime: (data.endTime as Timestamp)?.toDate(),
            } as Appointment;

            let providerProfile: ServiceProviderProfile | null = null;
            let professionalPhotoUrl: string | undefined = undefined;

            if (appointmentData.providerId) {
              providerProfile = (await getUserProfile(
                appointmentData.providerId
              )) as ServiceProviderProfile | null;

              if (providerProfile && appointmentData.professionalId) {
                professionalPhotoUrl = await fetchProfessionalPhotoUrl(
                  appointmentData.providerId,
                  appointmentData.professionalId
                );
              }
            } else {
              console.warn(
                `Agendamento com ID ${appointmentData.id} está sem providerId.`
              );
            }

            return {
              ...appointmentData,
              provider: providerProfile || undefined,
              professionalPhotoUrl: professionalPhotoUrl || undefined,
            };
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
        toast.error("Não foi possível carregar os agendamentos.");
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
   cancelAppointment: async (appointmentId, reason) => {
    // Usamos toast.promise para feedback visual automático (loading, success, error)
    const promise = cancelAppointmentSecurely(appointmentId, reason);

    toast.promise(promise, {
      loading: 'Verificando prazo de cancelamento...',
      success: 'Agendamento cancelado com sucesso!',
      error: (err) => {
        // Tenta extrair a mensagem amigável da Cloud Function
        const message = err?.message || 'Falha ao cancelar.';
        // Se for erro de prazo, a mensagem virá clara do backend
        return message; 
      },
    });

    try {
      await promise;
      // O onSnapshot se encarrega de atualizar a lista 'appointments' automaticamente
    } catch (error) {
      console.error('Erro na store ao cancelar:', error);
    }
  },
}));
