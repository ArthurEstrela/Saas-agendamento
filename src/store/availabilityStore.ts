import { create } from "zustand";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getAppointmentsForProfessionalOnDate } from "../firebase/bookingService";
import type { Professional, Service, DailyAvailability } from "../types";
import { getDay, format, parse } from "date-fns";
import { toast } from "react-hot-toast";

interface AvailabilityState {
  // Estado para o fluxo de agendamento (Cliente)
  availableSlots: string[];

  // Estado para o fluxo de gerenciamento
  availability: DailyAvailability[];

  isLoading: boolean;
  error: string | null;

  // Cliente: Buscar horários livres
  fetchAvailableSlots: (
    professional: Professional,
    service: Service,
    date: Date
  ) => Promise<void>;

  // Dashboard: Buscar configuração (recebe ID do Dono e ID do Profissional)
  fetchAvailability: (providerId: string, professionalId: string) => Promise<void>;

  // Dashboard: Salvar configuração (recebe ID do Dono e ID do Profissional)
  updateAvailability: (
    providerId: string,
    professionalId: string,
    availability: DailyAvailability[]
  ) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availableSlots: [],
  availability: [],
  isLoading: false,
  error: null,

  fetchAvailableSlots: async (professional, service, date) => {
    set({ isLoading: true, error: null, availableSlots: [] });
    try {
      const existingAppointments = await getAppointmentsForProfessionalOnDate(
        professional.id,
        date
      );

      const dayOfWeek = getDay(date);
      const weekDays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const availabilityList = professional.availability || [];
      const professionalDaySchedule = availabilityList.find(
        (day) => day.dayOfWeek === weekDays[dayOfWeek]
      );

      if (!professionalDaySchedule || !professionalDaySchedule.isAvailable) {
        throw new Error("O profissional não está disponível neste dia.");
      }

      const slots: string[] = [];
      const serviceDuration = service.duration;
      // Garante intervalo padrão se não definido
      const SLOT_INTERVAL_MINUTES = professional.slotInterval || 15;

      if (
        professionalDaySchedule.slots &&
        professionalDaySchedule.slots.length > 0
      ) {
        for (const period of professionalDaySchedule.slots) {
          if (!period.start || !period.end) continue;

          let currentTime = parse(period.start, "HH:mm", date);
          const endTime = parse(period.end, "HH:mm", date);

          if (isNaN(currentTime.getTime()) || isNaN(endTime.getTime()))
            continue;

          while (currentTime < endTime) {
            const slotTime = format(currentTime, "HH:mm");
            const slotEndTime = new Date(
              currentTime.getTime() + serviceDuration * 60000
            );

            if (slotEndTime > endTime) break;

            const isOccupied = existingAppointments.some(
              (app) =>
                (currentTime >= app.startTime && currentTime < app.endTime) ||
                (slotEndTime > app.startTime && slotEndTime <= app.endTime)
            );

            if (!isOccupied) {
              slots.push(slotTime);
            }

            currentTime = new Date(
              currentTime.getTime() + SLOT_INTERVAL_MINUTES * 60000
            );
          }
        }
      }

      set({ availableSlots: slots, isLoading: false });
    } catch (err) {
      let errorMessage = "Não foi possível buscar os horários.";
      if (err instanceof Error) errorMessage = err.message;
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Lógica de Gerenciamento Unificada ---

  fetchAvailability: async (providerId: string, professionalId: string) => {
    if (!providerId || !professionalId) {
       console.error("IDs inválidos para buscar disponibilidade");
       return;
    }
    
    set({ isLoading: true, error: null });
    try {
      // Busca na subcoleção do Provider -> Professionals
      const docRef = doc(db, "serviceProviders", providerId, "professionals", professionalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const availabilityData = Array.isArray(data.availability)
          ? data.availability
          : [];
        set({ availability: availabilityData });
      } else {
        console.warn("Documento de disponibilidade não encontrado. Iniciando vazio.");
        set({ availability: [] }); 
      }
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Erro ao buscar disponibilidade:", error);
      set({ error: "Erro ao carregar horários.", isLoading: false });
      toast.error("Erro ao carregar horários.");
    }
  },

  updateAvailability: async (
    providerId: string,
    professionalId: string,
    availability: DailyAvailability[]
  ) => {
    if (!providerId || !professionalId) {
        throw new Error("IDs inválidos para salvar disponibilidade");
    }

    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "serviceProviders", providerId, "professionals", professionalId);
      
      await updateDoc(docRef, { availability });
      
      set({ availability, isLoading: false });
    } catch (error: any) {
      console.error("Erro ao atualizar disponibilidade:", error);
      set({ error: "Erro ao salvar horários.", isLoading: false });
      throw error;
    }
  },
}));