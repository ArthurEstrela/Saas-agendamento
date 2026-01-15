import { useState, useEffect, useMemo, useCallback } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { getAppointmentsForProfessionalOnDate } from "../../firebase/bookingService";
import { ptBR } from "date-fns/locale";
import { format, isToday, set, startOfDay, addDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  CalendarX,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { DailyAvailability } from "../../types";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { Card, CardContent } from "../ui/card";

const weekDayMap: { [key: number]: DailyAvailability["dayOfWeek"] } = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const DateTimeSelection = () => {
  const {
    provider,
    selectedProfessional,
    selectedServices,
    selectedDate,
    selectedTimeSlot,
    selectDateAndTime,
    goToPreviousStep,
  } = useBookingProcessStore();

  const slotInterval = provider?.slotInterval || 15;
  const maxBookingDays = provider?.bookingWindowDays || 30;
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxBookingDays);

  const initialDate =
    selectedDate && new Date(selectedDate) >= today
      ? new Date(selectedDate)
      : today;

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [timeSlot, setTimeSlot] = useState<string | null>(selectedTimeSlot);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, service) => acc + service.duration, 0);
  }, [selectedServices]);

  const calculateAvailableSlots = useCallback(
    async (selectedDay: Date) => {
      if (!selectedProfessional) return [];
      const dayOfWeek = weekDayMap[selectedDay.getDay()];
      const dayAvailability = selectedProfessional.availability.find(
        (a) => a.dayOfWeek === dayOfWeek
      );

      if (!dayAvailability || !dayAvailability.isAvailable) return [];

      const existingAppointments = await getAppointmentsForProfessionalOnDate(
        selectedProfessional.id,
        selectedDay
      );
      const slots: string[] = [];
      const now = new Date();
      const isSelectedDateToday = isToday(selectedDay);

      for (const workSlot of dayAvailability.slots) {
        const [startHour, startMinute] = workSlot.start.split(":").map(Number);
        const [endHour, endMinute] = workSlot.end.split(":").map(Number);

        let currentTime = set(selectedDay, {
          hours: startHour,
          minutes: startMinute,
          seconds: 0,
          milliseconds: 0,
        });
        const endTime = set(selectedDay, {
          hours: endHour,
          minutes: endMinute,
          seconds: 0,
          milliseconds: 0,
        });

        while (currentTime < endTime) {
          const potentialSlotEnd = new Date(
            currentTime.getTime() + totalDuration * 60000
          );
          
          const isPast = isSelectedDateToday && currentTime < now;
          const fitsInWorkSlot = potentialSlotEnd <= endTime;
          
          const isOverlapping = existingAppointments.some(
            (appt) =>
              (currentTime >= appt.startTime && currentTime < appt.endTime) ||
              (potentialSlotEnd > appt.startTime && potentialSlotEnd <= appt.endTime) ||
              (currentTime <= appt.startTime && potentialSlotEnd >= appt.endTime)
          );

          if (!isPast && fitsInWorkSlot && !isOverlapping) {
            slots.push(format(currentTime, "HH:mm"));
          }

          currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
        }
      }
      return slots;
    },
    [selectedProfessional, totalDuration, slotInterval]
  );

  useEffect(() => {
    let isActive = true;
    const fetchSlots = async () => {
      if (date instanceof Date) {
        setIsLoadingTimes(true);
        setAvailableTimes([]);
        setTimeSlot(null);
        try {
          const slots = await calculateAvailableSlots(date);
          if (isActive) setAvailableTimes(slots);
        } catch (error) {
          console.error("Erro ao buscar horários", error);
        } finally {
          if (isActive) setIsLoadingTimes(false);
        }
      } else {
        if (isActive) {
          setIsLoadingTimes(false);
          setAvailableTimes([]);
        }
      }
    };
    fetchSlots();
    return () => {
      isActive = false;
    };
  }, [date, calculateAvailableSlots]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) setDate(startOfDay(newDate));
    else setDate(undefined);
  };

  const handleConfirm = () => {
    if (date && timeSlot) {
      selectDateAndTime(date, timeSlot);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 md:pb-32"
    >
      <div className="text-center mb-6 md:mb-10">
        <Typography variant="h2" className="drop-shadow-sm text-2xl md:text-3xl">
          Data e Horário
        </Typography>
        <Typography variant="muted" className="text-sm md:text-base">
          Quando você gostaria de ser atendido?
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-6xl mx-auto px-2 md:px-4">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-[#18181b] md:bg-gray-900/60 border border-white/5 rounded-2xl p-4 md:shadow-2xl w-full max-w-[360px] md:backdrop-blur-md flex items-center justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={ptBR}
              disabled={[
                { before: today },
                { after: maxDate }
              ]}
              className="w-full"
            />
          </div>
        </div>

        {/* Coluna dos Horários */}
        <div className="lg:col-span-7">
          <Card className="h-full bg-[#18181b] md:bg-gray-900/60 border-white/5 md:backdrop-blur-sm md:shadow-xl">
            <CardContent className="p-4 md:p-6 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-4 md:mb-6 pb-4 border-b border-white/5">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                  <Clock size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg md:text-xl text-white">
                    {date
                      ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : "Selecione uma data"}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400">
                    {date
                      ? isLoadingTimes
                        ? "Verificando..."
                        : `${availableTimes.length} horários disponíveis`
                      : "Aguardando seleção no calendário"}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-[300px] md:min-h-[350px]">
                {isLoadingTimes ? (
                  <div className="h-full flex flex-col items-center justify-center text-primary/80">
                    <Loader2 className="animate-spin mb-3" size={32} />
                    <span className="text-xs md:text-sm font-medium animate-pulse">
                      Buscando disponibilidade...
                    </span>
                  </div>
                ) : !date ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                    <ChevronLeft size={40} className="mb-4 text-gray-700 md:w-14 md:h-14" />
                    <span className="text-sm md:text-base font-medium">
                      Escolha um dia no calendário
                    </span>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3 content-start">
                    {availableTimes.map((slot) => (
                      <motion.button
                        key={slot}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTimeSlot(slot)}
                        className={cn(
                          "h-10 md:h-12 rounded-lg text-xs md:text-sm font-bold border transition-all duration-200 touch-manipulation",
                          timeSlot === slot
                            ? "bg-primary text-black border-primary md:shadow-[0_0_15px_rgba(218,165,32,0.4)] ring-2 ring-primary/20"
                            : "bg-[#27272a] md:bg-gray-800/50 text-gray-300 border-white/5 hover:border-gray-500 hover:bg-gray-700 hover:text-white"
                        )}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <CalendarX size={24} className="text-gray-600 md:w-8 md:h-8" />
                    </div>
                    <p className="text-center font-medium text-base md:text-lg text-gray-400">
                      Sem horários livres
                    </p>
                    <p className="text-center text-xs md:text-sm mt-1 text-gray-600">
                      Tente selecionar outro dia.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Fixo Otimizado */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-2 md:p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-[#121214] border-t border-white/10 md:bg-gray-900/90 md:backdrop-blur-xl md:border md:rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4 ring-1 ring-white/5 rounded-xl md:rounded-2xl">
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            className="hover:bg-white/5 px-2 md:px-4"
          >
            <ChevronLeft size={16} className="mr-1 md:mr-2" /> <span className="hidden sm:inline">Voltar</span>
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!date || !timeSlot || isLoadingTimes}
            className="w-full sm:w-auto px-6 md:px-8 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            Confirmar <span className="hidden sm:inline">e Avançar</span> <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};