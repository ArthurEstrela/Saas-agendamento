import { create } from "zustand";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getAppointmentsForProfessionalOnDate } from "../firebase/bookingService";
import type { Professional, Service, DailyAvailability } from "../types";
import { getDay, format, parse, addMinutes, isBefore, isAfter, isEqual } from "date-fns";
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

  // Dashboard: Buscar configuração
  fetchAvailability: (providerId: string, professionalId: string) => Promise<void>;

  // Dashboard: Salvar configuração
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
        // Se não trabalha no dia, limpa slots e finaliza
        set({ availableSlots: [], isLoading: false });
        return;
      }

      const slots: string[] = [];
      const serviceDuration = service.duration;
      // Garante intervalo padrão se não definido (fallback para 15min)
      const SLOT_INTERVAL_MINUTES = professional.slotInterval || 15;

      if (professionalDaySchedule.slots && professionalDaySchedule.slots.length > 0) {
        for (const period of professionalDaySchedule.slots) {
          if (!period.start || !period.end) continue;

          // Parse strings "HH:mm" para objetos Date no dia selecionado
          let currentTime = parse(period.start, "HH:mm", date);
          const endTime = parse(period.end, "HH:mm", date);

          if (isNaN(currentTime.getTime()) || isNaN(endTime.getTime())) continue;

          // Loop gerando slots enquanto houver tempo hábil antes do fim do período
          while (isBefore(currentTime, endTime)) {
            const slotTimeStr = format(currentTime, "HH:mm");
            const slotEndTime = addMinutes(currentTime, serviceDuration);

            // Se o término do serviço ultrapassar o fim do expediente/turno, para o loop
            if (isAfter(slotEndTime, endTime)) break;

            // Verifica colisão com agendamentos existentes
            // Nota: Assume-se que app.startTime e app.endTime são objetos Date retornados pelo service
            const isOccupied = existingAppointments.some((app) => {
              // Lógica de sobreposição de horários
              const appStart = app.startTime;
              const appEnd = app.endTime;

              // 1. O slot começa dentro de um agendamento existente
              const startsInside = (isAfter(currentTime, appStart) || isEqual(currentTime, appStart)) && isBefore(currentTime, appEnd);
              
              // 2. O slot termina dentro de um agendamento existente
              const endsInside = isAfter(slotEndTime, appStart) && (isBefore(slotEndTime, appEnd) || isEqual(slotEndTime, appEnd));
              
              // 3. O slot engloba totalmente um agendamento existente (raro, mas possível se duração for longa)
              const encompasses = isBefore(currentTime, appStart) && isAfter(slotEndTime, appEnd);

              return startsInside || endsInside || encompasses;
            });

            if (!isOccupied) {
              slots.push(slotTimeStr);
            }

            // Avança para o próximo slot
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

  // --- Lógica de Gerenciamento Unificada ---

  fetchAvailability: async (providerId: string, professionalId: string) => {
    if (!providerId || !professionalId) {
      console.error("IDs inválidos para buscar disponibilidade");
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const docRef = doc(db, "serviceProviders", providerId, "professionals", professionalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Casting seguro: Assumimos que o documento segue a interface Professional (ou parcial)
        const data = docSnap.data() as Partial<Professional>;
        const availabilityData = Array.isArray(data.availability)
          ? data.availability
          : [];
        set({ availability: availabilityData });
      } else {
        console.warn("Documento de disponibilidade não encontrado. Iniciando vazio.");
        set({ availability: [] });
      }
      set({ isLoading: false });
    } catch (error: unknown) {
      console.error("Erro ao buscar disponibilidade:", error);
      const msg = error instanceof Error ? error.message : "Erro desconhecido ao carregar horários.";
      set({ error: msg, isLoading: false });
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
      toast.success("Horários atualizados com sucesso!"); // Feedback visual positivo opcional, mas recomendado
    } catch (error: unknown) {
      console.error("Erro ao atualizar disponibilidade:", error);
      const msg = error instanceof Error ? error.message : "Erro desconhecido ao salvar horários.";
      set({ error: msg, isLoading: false });
      toast.error("Erro ao salvar horários.");
      throw error; // Re-throw para que o componente possa tratar se necessário
    }
  },
}));