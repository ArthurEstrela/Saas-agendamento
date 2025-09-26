import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  // NOVOS IMPORTS para buscar o documento do profissional
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type {
  Appointment,
  ServiceProviderProfile,
  Professional,
} from "../types"; // Importar Professional para tipagem
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

// 1. FUNÇÃO AUXILIAR PARA BUSCAR A FOTO NA SUB-COLEÇÃO
const fetchProfessionalPhotoUrl = async (
  providerId: string,
  professionalId: string
): Promise<string | undefined> => {
  try {
    // Cria a referência direta ao documento na sub-coleção
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

    // Cancela qualquer listener anterior antes de criar um novo
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
              // 1. Busca o perfil do provedor (necessário para businessName, address, etc.)
              providerProfile = (await getUserProfile(
                appointmentData.providerId
              )) as ServiceProviderProfile | null;

              // 2. BUSCA A FOTO NA NOVA SUB-COLEÇÃO (Lógica Corrigida)
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
