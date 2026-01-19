import { create } from "zustand";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getAppointmentsForProfessionalOnDate } from "../firebase/bookingService";
import type { Professional, Service, DailyAvailability } from "../types";
import { getDay, format, parse, addMinutes, isBefore, isAfter, isEqual } from "date-fns";
import { toast } from "react-hot-toast";

// Configuração de tolerância para arredondamento (5 minutos) 
// Definido fora da store para evitar erros de sintaxe ✅
const TOLERANCE_MINUTES = 5;

interface AvailabilityState {
  availableSlots: string[];
  availability: DailyAvailability[];
  isLoading: boolean;
  error: string | null;
  fetchAvailableSlots: (
    professional: Professional,
    service: Service,
    date: Date
  ) => Promise<void>;
  fetchAvailability: (providerId: string, professionalId: string) => Promise<void>;
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

      const dayOfWeekIndex = getDay(date);
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
        (day) => day.dayOfWeek === weekDays[dayOfWeekIndex]
      );

      if (!professionalDaySchedule || !professionalDaySchedule.isAvailable) {
        set({ availableSlots: [], isLoading: false });
        return;
      }

      const slots: string[] = [];
      const serviceDuration = service.duration;
      const SLOT_INTERVAL_MINUTES = professional.slotInterval || 15;

      if (professionalDaySchedule.slots && professionalDaySchedule.slots.length > 0) {
        for (const period of professionalDaySchedule.slots) {
          if (!period.start || !period.end) continue;

          let currentTime = parse(period.start, "HH:mm", date);
          const endTime = parse(period.end, "HH:mm", date);

          if (isNaN(currentTime.getTime()) || isNaN(endTime.getTime())) continue;

          while (isBefore(currentTime, endTime)) {
            const slotTimeStr = format(currentTime, "HH:mm");
            const slotEndTime = addMinutes(currentTime, serviceDuration);

            if (isAfter(slotEndTime, endTime)) break;

            const isOccupied = existingAppointments.some((app) => {
              const appStart = app.startTime;
              const appEnd = app.endTime;

              // Lógica de colisão com tolerância de 5 minutos 🛡️
              
              // 1. O slot começa dentro de um agendamento (ignorando os últimos 5 min dele)
              const startsInside = (isAfter(currentTime, appStart) || isEqual(currentTime, appStart)) && 
                                   isBefore(currentTime, addMinutes(appEnd, -TOLERANCE_MINUTES));
              
              // 2. O slot termina dentro de um agendamento (ignorando os primeiros 5 min dele)
              const endsInside = isAfter(slotEndTime, addMinutes(appStart, TOLERANCE_MINUTES)) && 
                                 (isBefore(slotEndTime, appEnd) || isEqual(slotEndTime, appEnd));
              
              // 3. O slot engloba totalmente um agendamento (raro, mas protegido com buffer)
              const encompasses = isBefore(currentTime, addMinutes(appStart, TOLERANCE_MINUTES)) && 
                                  isAfter(slotEndTime, addMinutes(appEnd, -TOLERANCE_MINUTES));

              return startsInside || endsInside || encompasses;
            });

            if (!isOccupied) {
              slots.push(slotTimeStr);
            }

            currentTime = addMinutes(currentTime, SLOT_INTERVAL_MINUTES);
          }
        }
      }

      set({ availableSlots: slots, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Não foi possível buscar os horários.";
      console.error("Erro em fetchAvailableSlots:", err);
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchAvailability: async (providerId: string, professionalId: string) => {
    if (!providerId || !professionalId) return;
    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "serviceProviders", providerId, "professionals", professionalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<Professional>;
        set({ availability: Array.isArray(data.availability) ? data.availability : [] });
      } else {
        set({ availability: [] });
      }
      set({ isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao carregar horários.";
      set({ error: msg, isLoading: false });
      toast.error("Erro ao carregar horários.");
    }
  },

  updateAvailability: async (
    providerId: string,
    professionalId: string,
    availability: DailyAvailability[]
  ) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "serviceProviders", providerId, "professionals", professionalId);
      await updateDoc(docRef, { availability });
      set({ availability, isLoading: false });
      toast.success("Horários atualizados com sucesso!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao salvar horários.";
      set({ error: msg, isLoading: false });
      toast.error("Erro ao salvar horários.");
      throw error;
    }
  },
}));