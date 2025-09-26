// src/store/bookingProcessStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Service,
  Professional,
  ServiceProviderProfile,
  Appointment,
} from "../types";
import { createAppointment } from "../firebase/bookingService";
import { getUserProfile } from "../firebase/userService";
// NOVO: Importa a função de busca da sub-coleção de profissionais
import { getProfessionalsByProviderId } from "../firebase/professionalsManagementService";

// Interface para o estado (ATUALIZADA)
interface BookingState {
  provider: ServiceProviderProfile | null;
  isLoading: boolean;
  // NOVOS ESTADOS PARA A SUB-COLEÇÃO
  providerProfessionals: Professional[] | null; // Lista de profissionais do provider
  isLoadingProfessionals: boolean; // Estado de carregamento da sub-coleção

  selectedServices: Service[];
  professional: Professional | null;
  date: Date | null;
  timeSlot: string | null;
  currentStep: number;
  isBooking: boolean;
  bookingSuccess: boolean;
  bookingError: string | null;
  redirectUrlAfterLogin: string | null;
}

// Interface para as ações (ATUALIZADA)
interface BookingActions {
  fetchProviderDetailsById: (
    providerId: string
  ) => Promise<ServiceProviderProfile | null>; 
  // NOVA AÇÃO: Para buscar a sub-coleção de profissionais
  fetchProviderProfessionals: (providerId: string) => Promise<void>; 
  syncStateWithFreshProvider: (freshProvider: ServiceProviderProfile) => void; 
  toggleService: (service: Service) => void;
  selectProfessional: (professional: Professional) => void;
  selectDateTime: (date: Date, timeSlot: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: (keepProvider?: boolean) => void;
  setRedirectUrlAfterLogin: (url: string | null) => void;
  confirmBooking: (appointmentData: Omit<Appointment, "id">) => Promise<void>;
}

interface BookingStore extends BookingState, BookingActions {}

const initialState: BookingState = {
  provider: null,
  isLoading: true,
  // NOVOS ESTADOS INICIALIZADOS
  providerProfessionals: null,
  isLoadingProfessionals: false,
  
  selectedServices: [],
  professional: null,
  date: null,
  timeSlot: null,
  currentStep: 1,
  isBooking: false,
  bookingSuccess: false,
  bookingError: null,
  redirectUrlAfterLogin: null,
};

export const useBookingProcessStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // NOVO MÉTODO: Busca a sub-coleção de profissionais
      fetchProviderProfessionals: async (providerId) => {
        set({ isLoadingProfessionals: true });
        try {
          // Usa a função de serviço refatorada para buscar a sub-coleção
          const professionalsList = await getProfessionalsByProviderId(providerId);
          set({
            providerProfessionals: professionalsList,
            isLoadingProfessionals: false,
          });
        } catch (error) {
          console.error("Erro ao buscar profissionais do provedor:", error);
          set({ 
            isLoadingProfessionals: false, 
            providerProfessionals: [], // Retorna vazio em caso de erro para não travar a UI
            bookingError: "Não foi possível carregar a lista de profissionais.",
          });
        }
      },

      // MÉTODO ATUALIZADO: Chama a busca por profissionais
      fetchProviderDetailsById: async (providerId) => {
        set({ isLoading: true });
        try {
          const providerProfile = await getUserProfile(providerId);
          if (providerProfile && providerProfile.role === "serviceProvider") {
            const freshProvider = providerProfile as ServiceProviderProfile;
            
            // 1. Define o perfil principal (sem a lista de profissionais)
            set({
              provider: freshProvider,
              isLoading: false,
            });
            
            // 2. CHAMA A NOVA FUNÇÃO DE BUSCA DA SUB-COLEÇÃO
            get().fetchProviderProfessionals(providerId); 

            return freshProvider;
          } else {
            throw new Error("Prestador não encontrado.");
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do prestador por ID:", error);
          set({ isLoading: false, provider: null });
          return null;
        }
      },

      // FUNÇÃO DE SINCRONIZAÇÃO REFATORADA (O PONTO CRÍTICO)
      syncStateWithFreshProvider: (freshProvider) => {
        // Pega a lista de profissionais do NOVO estado dedicado
        const { selectedServices, professional, providerProfessionals: currentProfessionals } = get();
        
        // A lista de profissionais a ser usada para validação
        const professionalsList = currentProfessionals || [];

        // 1. Valida os serviços selecionados (lógica inalterada)
        const validSelectedServices = selectedServices.filter((selected) =>
          freshProvider.services.some(
            (freshService) => freshService.id === selected.id
          )
        );

        // 2. Valida o profissional selecionado usando a NOVA lista de sub-coleção
        const isProfessionalStillAvailable = professionalsList.some( 
          (freshProf) => freshProf.id === professional?.id
        );
        const validProfessional = isProfessionalStillAvailable
          ? professional
          : null;

        // 3. Define as condições de reset
        const servicesChanged = validSelectedServices.length !== selectedServices.length;
        const professionalRemoved = !isProfessionalStillAvailable && professional !== null;
        const shouldResetDateTime = servicesChanged || professionalRemoved;

        set({
          provider: freshProvider,
          selectedServices: validSelectedServices,
          professional: validProfessional,
          date: shouldResetDateTime ? null : get().date,
          timeSlot: shouldResetDateTime ? null : get().timeSlot,
          // Se o profissional foi removido, volta para a seleção de profissional (currentStep: 2)
          currentStep:
            get().currentStep > 2 && (servicesChanged || professionalRemoved) ? 2 : get().currentStep,
          isLoading: false,
          // IMPORTANTE: Não atualizamos providerProfessionals ou isLoadingProfessionals aqui.
          // Eles são gerenciados exclusivamente por fetchProviderProfessionals.
        });
      },

      toggleService: (service) => {
        const { selectedServices } = get();
        const isSelected = selectedServices.some((s) => s.id === service.id);
        const newSelectedServices = isSelected
          ? selectedServices.filter((s) => s.id !== service.id)
          : [...selectedServices, service];
        set({ 
            selectedServices: newSelectedServices,
            // Boa Prática: Reseta os passos seguintes ao mudar serviços
            professional: null,
            date: null,
            timeSlot: null,
            currentStep: 2, 
        });
      },
      selectProfessional: (professional) =>
        set({ professional, date: null, timeSlot: null, currentStep: 3 }),
      selectDateTime: (date, timeSlot) => set({ date, timeSlot }),
      goToNextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),
      goToPreviousStep: () =>
        set((state) => ({ currentStep: state.currentStep - 1 })),

      // MÉTODO ATUALIZADO: Inclui reset dos novos estados
      resetBooking: (keepProvider = false) => {
        const providerToKeep = keepProvider ? get().provider : null;
        set({
          ...initialState,
          provider: providerToKeep,
          isLoading: !keepProvider,
          // Assegura que o estado dos profissionais também seja resetado
          providerProfessionals: null, 
          isLoadingProfessionals: false,
          redirectUrlAfterLogin: null,
        });
      },

      setRedirectUrlAfterLogin: (url) => set({ redirectUrlAfterLogin: url }),

      confirmBooking: async (appointmentData) => {
        set({ isBooking: true, bookingError: null });
        try {
          await createAppointment(appointmentData);
          set({ isBooking: false, bookingSuccess: true });
        } catch (error) {
          console.error("Erro ao confirmar agendamento:", error);
          set({
            isBooking: false,
            bookingError: "Falha ao criar o agendamento. Tente novamente.",
          });
        }
      },
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => localStorage),
      // PARTIALIZE ATUALIZADO: Não persisitimos dados de carregamento ou lista de profissionais
      partialize: (state) => ({
        selectedServices: state.selectedServices,
        professional: state.professional,
        date: state.date,
        timeSlot: state.timeSlot,
        currentStep: state.currentStep,
        redirectUrlAfterLogin: state.redirectUrlAfterLogin,
      }),
    }
  )
);