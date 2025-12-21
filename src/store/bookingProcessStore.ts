// src/store/bookingProcessStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "react-hot-toast";
import type {
  Service,
  Professional,
  ServiceProviderProfile,
  Appointment,
  ClientProfile,
} from "../types";
// A importação abaixo agora chama sua função segura (Cloud Function)
import { createAppointment } from "../firebase/bookingService";
import { getUserProfile } from "../firebase/userService";
import { getProfessionalsByProviderId } from "../firebase/professionalsManagementService";

// Representa o estado do processo de agendamento
interface BookingFlowState {
  // Dados do fluxo
  providerId: string | null;
  provider: ServiceProviderProfile | null;
  professionals: Professional[];

  // Seleções do usuário
  selectedServices: Service[];
  selectedProfessional: Professional | null;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;

  // Controle do fluxo
  currentStep: number;
  status: {
    isLoading: boolean;
    isConfirming: boolean;
    error: string | null;
    isSuccess: boolean;
  };

  // Utilidade para login
  redirectUrlAfterLogin: string | null;
}

// Ações que podem ser executadas no store
interface BookingFlowActions {
  /** Inicia o fluxo ou carrega os dados de um prestador. */
  fetchProviderData: (providerId: string) => Promise<void>;

  /** Adiciona ou remove um serviço da seleção. */
  toggleService: (service: Service) => void;

  /** Seleciona um profissional e avança a etapa. */
  selectProfessional: (professional: Professional) => void;

  /** Seleciona data e hora e avança a etapa. */
  selectDateAndTime: (date: Date, timeSlot: string) => void;

  /** Confirma e cria o agendamento no banco de dados via Cloud Functions. */
  confirmBooking: (client: ClientProfile) => Promise<void>;

  /** Funções de navegação e controle. */
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setRedirectUrlAfterLogin: (url: string | null) => void;
  resetBookingState: (keepProvider?: boolean) => void;
}

type BookingStore = BookingFlowState & BookingFlowActions;

const initialState: BookingFlowState = {
  providerId: null,
  provider: null,
  professionals: [],
  selectedServices: [],
  selectedProfessional: null,
  selectedDate: null,
  selectedTimeSlot: null,
  currentStep: 1, // 1: Serviço, 2: Profissional, 3: Data/Hora, 4: Confirmação
  status: {
    isLoading: false,
    isConfirming: false,
    error: null,
    isSuccess: false,
  },
  redirectUrlAfterLogin: null,
};

export const useBookingProcessStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProviderData: async (providerId) => {
        set({
          status: { ...initialState.status, isLoading: true },
          providerId,
        });
        try {
          const profilePromise = getUserProfile(providerId);
          const professionalsPromise = getProfessionalsByProviderId(providerId);

          const [providerProfile, professionals] = await Promise.all([
            profilePromise,
            professionalsPromise,
          ]);

          if (!providerProfile || providerProfile.role !== "serviceProvider") {
            throw new Error("Prestador de serviço não encontrado.");
          }

          set({
            provider: providerProfile as ServiceProviderProfile,
            professionals,
            status: { ...initialState.status, isLoading: false },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados.";
          toast.error(errorMessage);
          set({
            ...initialState,
            status: {
              ...initialState.status,
              isLoading: false,
              error: errorMessage,
            },
          });
        }
      },

      toggleService: (service) => {
        const { selectedServices } = get();
        const isSelected = selectedServices.some((s) => s.id === service.id);
        const newSelectedServices = isSelected
          ? selectedServices.filter((s) => s.id !== service.id)
          : [...selectedServices, service];

        // Reseta as seleções futuras para garantir consistência
        set({
          selectedServices: newSelectedServices,
          selectedProfessional: null,
          selectedDate: null,
          selectedTimeSlot: null,
        });
      },

      selectProfessional: (professional) => {
        set({
          selectedProfessional: professional,
          selectedDate: null,
          selectedTimeSlot: null,
        });
      },

      selectDateAndTime: (date, timeSlot) => {
        set({ selectedDate: date, selectedTimeSlot: timeSlot, currentStep: 4 });
      },

      confirmBooking: async (client) => {
        const {
          provider,
          selectedServices,
          selectedProfessional,
          selectedDate,
          selectedTimeSlot,
        } = get();

        // Validação dos dados
        if (
          !provider ||
          selectedServices.length === 0 ||
          !selectedProfessional ||
          !selectedDate ||
          !selectedTimeSlot
        ) {
          toast.error("Informações incompletas para finalizar o agendamento.");
          return;
        }

        set({ status: { ...get().status, isConfirming: true } });

        // Cálculos de Tempo
        const totalDuration = selectedServices.reduce(
          (acc, s) => acc + s.duration,
          0
        );

        // Configuração segura das datas
        const startTime = new Date(selectedDate);
        const [hours, minutes] = selectedTimeSlot.split(":").map(Number);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime.getTime() + totalDuration * 60000);

        // Montagem do objeto para a Cloud Function
        // OBS: Não usamos serverTimestamp() aqui pois ele não é serializável para a API.
        // A Cloud Function irá gerar o timestamp oficial do servidor.
        const appointmentData: Omit<Appointment, "id"> = {
          clientId: client.id,
          clientName: client.name,
          providerId: provider.id,
          professionalId: selectedProfessional.id,
          professionalName: selectedProfessional.name,
          services: selectedServices,
          serviceName: selectedServices.map((s) => s.name).join(", "),
          startTime,
          endTime,
          status: "pending",
          totalPrice: selectedServices.reduce((acc, s) => acc + s.price, 0),
          totalDuration,
          createdAt: new Date(), // Envia data local apenas para validar tipo, backend sobrescreve.
          notes: "", // Campo opcional preparado para expansão futura
        };

        const promise = createAppointment(appointmentData);

        toast.promise(promise, {
          loading: "Processando agendamento seguro...",
          success: "Agendamento confirmado com sucesso!",
          error: (err) => {
            // Se o erro for de conflito (Race Condition), mostramos a mensagem clara
            if (err.message && err.message.includes("já foi reservado")) {
              return "Ops! Este horário acabou de ser ocupado. Tente outro.";
            }
            return "Erro ao agendar. Tente novamente.";
          },
        });

        try {
          await promise;
          set({ status: { ...initialState.status, isSuccess: true } });
        } catch (error) {
          console.error("Erro no confirmBooking:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido.";

          set({
            status: {
              ...initialState.status,
              isConfirming: false,
              error: errorMessage,
            },
          });
        }
      },

      goToNextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),
      goToPreviousStep: () =>
        set((state) => ({ currentStep: state.currentStep - 1 })),
      setRedirectUrlAfterLogin: (url) => set({ redirectUrlAfterLogin: url }),
      resetBookingState: (keepProvider = false) => {
        const { provider, professionals, providerId, redirectUrlAfterLogin } =
          get();
        set({
          ...initialState,
          provider: keepProvider ? provider : null,
          professionals: keepProvider ? professionals : [],
          providerId: keepProvider ? providerId : null,
          redirectUrlAfterLogin, // Sempre manter o redirect até ser usado
        });
      },
    }),
    {
      name: "booking-flow-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Apenas salve o que for essencial para o usuário continuar de onde parou
        providerId: state.providerId,
        selectedServices: state.selectedServices,
        selectedProfessional: state.selectedProfessional,
        selectedDate: state.selectedDate,
        selectedTimeSlot: state.selectedTimeSlot,
        currentStep: state.currentStep,
        redirectUrlAfterLogin: state.redirectUrlAfterLogin,
      }),
    }
  )
);
