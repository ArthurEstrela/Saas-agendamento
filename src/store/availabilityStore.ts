import { create } from 'zustand';
import { getAppointmentsForProfessionalOnDate } from '../firebase/bookingService';
import type { Professional, Service } from '../types';
import { getDay, format, parse } from 'date-fns';

interface AvailabilityState {
  availableSlots: string[];
  isLoading: boolean;
  error: string | null;
  fetchAvailableSlots: (
    professional: Professional,
    service: Service,
    date: Date
  ) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availableSlots: [],
  isLoading: false,
  error: null,

  fetchAvailableSlots: async (professional, service, date) => {
    set({ isLoading: true, error: null, availableSlots: [] });
    try {
      // 1. Pega os agendamentos já existentes para o dia
      const existingAppointments = await getAppointmentsForProfessionalOnDate(professional.id, date);

      // 2. Pega o horário de trabalho do profissional para o dia da semana selecionado
      const dayOfWeek = getDay(date); // Domingo = 0, Segunda = 1, etc.
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const professionalDaySchedule = professional.availability.find(
        (day) => day.dayOfWeek === weekDays[dayOfWeek]
      );

      if (!professionalDaySchedule || !professionalDaySchedule.isAvailable) {
        throw new Error("O profissional não está disponível neste dia.");
      }

      // 3. Gera todos os possíveis horários de início
      const slots: string[] = [];
      const serviceDuration = service.duration; // em minutos

      for (const period of professionalDaySchedule.slots) {
        let currentTime = parse(period.start, 'HH:mm', new Date());
        const endTime = parse(period.end, 'HH:mm', new Date());

        while (currentTime < endTime) {
          const slotTime = format(currentTime, 'HH:mm');
          const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);

          // Verifica se o slot termina depois do fim do expediente
          if (slotEndTime > endTime) break;

          // 4. Verifica se o slot colide com algum agendamento existente
          const isOccupied = existingAppointments.some(app => 
            (currentTime >= app.startTime && currentTime < app.endTime) || // Começa durante o agendamento
            (slotEndTime > app.startTime && slotEndTime <= app.endTime) // Termina durante o agendamento
          );
          
          if (!isOccupied) {
            slots.push(slotTime);
          }

          // Avança para o próximo possível horário
          currentTime = new Date(currentTime.getTime() + serviceDuration * 60000); // ou + intervalo (ex: 15 min)
        }
      }

      set({ availableSlots: slots, isLoading: false });

    } catch (err) {
      let errorMessage = "Não foi possível buscar os horários.";
      if (err instanceof Error) errorMessage = err.message;
      set({ error: errorMessage, isLoading: false });
    }
  },
}));