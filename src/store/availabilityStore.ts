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

  // Estado para o fluxo de gerenciamento (Profissional) - FALTAVA ISSO
  availability: DailyAvailability[];

  isLoading: boolean;
  error: string | null;

  // Ação: Buscar horários livres para um serviço em uma data (Cliente)
  fetchAvailableSlots: (
    professional: Professional,
    service: Service,
    date: Date
  ) => Promise<void>;

  // Ação: Buscar a configuração de horários do profissional (Dashboard) - FALTAVA ISSO
  fetchAvailability: (providerId: string) => Promise<void>;

  // Ação: Salvar a configuração de horários (Dashboard) - FALTAVA ISSO
  updateAvailability: (
    providerId: string,
    availability: DailyAvailability[]
  ) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availableSlots: [],
  availability: [], // Inicializa vazio para não quebrar a UI
  isLoading: false,
  error: null,

  // --- Lógica de Agendamento (Mantida do seu código original) ---
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

      // Garante que availability existe para evitar crash
      const availabilityList = professional.availability || [];

      const professionalDaySchedule = availabilityList.find(
        (day) => day.dayOfWeek === weekDays[dayOfWeek]
      );

      if (!professionalDaySchedule || !professionalDaySchedule.isAvailable) {
        throw new Error("O profissional não está disponível neste dia.");
      }

      const slots: string[] = [];
      const serviceDuration = service.duration;
      const SLOT_INTERVAL_MINUTES = 15;

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
      // toast.error(errorMessage); // Opcional
    }
  },

  // --- Lógica de Gerenciamento (Adicionada para corrigir o erro) ---
  fetchAvailability: async (providerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "users", providerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Garante que é um array, mesmo se o campo não existir no banco
        const availabilityData = Array.isArray(data.availability)
          ? data.availability
          : [];
        set({ availability: availabilityData });
      } else {
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
    availability: DailyAvailability[]
  ) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "users", providerId);
      // Atualiza apenas o campo availability no Firestore
      await updateDoc(docRef, { availability });
      set({ availability, isLoading: false });
    } catch (error: any) {
      console.error("Erro ao atualizar disponibilidade:", error);
      set({ error: "Erro ao salvar horários.", isLoading: false });
      throw error; // Lança o erro para o componente tratar
    }
  },
}));
