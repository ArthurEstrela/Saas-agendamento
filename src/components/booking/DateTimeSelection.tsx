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
    provider, // <-- Pegamos o Provider aqui (que tem a config bookingWindowDays)
    selectedProfessional,
    selectedServices,
    selectedDate,
    selectedTimeSlot,
    selectDateAndTime,
    goToPreviousStep,
  } = useBookingProcessStore();

  // Lógica corrigida: usa a config do Provider (Dono)
  const maxBookingDays = provider?.bookingWindowDays || 30;

  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxBookingDays);

  const initialDate =
    selectedDate && new Date(selectedDate) >= today
      ? new Date(selectedDate)
      : undefined;

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
              (potentialSlotEnd > appt.startTime &&
                potentialSlotEnd <= appt.endTime) ||
              (currentTime <= appt.startTime &&
                potentialSlotEnd >= appt.endTime)
          );

          if (!isPast && fitsInWorkSlot && !isOverlapping) {
            slots.push(format(currentTime, "HH:mm"));
          }
          currentTime = new Date(currentTime.getTime() + 15 * 60000); // Intervalo de 15 min
        }
      }
      return slots;
    },
    [selectedProfessional, totalDuration]
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
      className="pb-32"
    >
      <div className="text-center mb-10">
        <Typography variant="h2" className="drop-shadow-sm">
          Data e Horário
        </Typography>
        <Typography variant="muted">
          Quando você gostaria de ser atendido?
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto px-2">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 shadow-2xl w-full max-w-[360px] backdrop-blur-md flex items-center justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={ptBR}
              // Bloqueia datas fora da janela permitida
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
          <Card className="h-full bg-gray-900/60 border-white/5 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">
                    {date
                      ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : "Selecione uma data"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {date
                      ? isLoadingTimes
                        ? "Verificando..."
                        : `${availableTimes.length} horários disponíveis`
                      : "Aguardando seleção no calendário"}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-[350px]">
                {isLoadingTimes ? (
                  <div className="h-full flex flex-col items-center justify-center text-primary/80">
                    <Loader2 className="animate-spin mb-3" size={40} />
                    <span className="text-sm font-medium animate-pulse">
                      Buscando disponibilidade...
                    </span>
                  </div>
                ) : !date ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                    <ChevronLeft size={56} className="mb-4 text-gray-700" />
                    <span className="text-base font-medium">
                      Escolha um dia ao lado
                    </span>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 content-start">
                    {availableTimes.map((slot) => (
                      <motion.button
                        key={slot}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTimeSlot(slot)}
                        className={cn(
                          "h-12 rounded-lg text-sm font-bold border transition-all duration-200 shadow-sm",
                          timeSlot === slot
                            ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(218,165,32,0.4)] ring-2 ring-primary/20"
                            : "bg-gray-800/50 text-gray-300 border-white/5 hover:border-gray-500 hover:bg-gray-700 hover:text-white"
                        )}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <CalendarX size={32} className="text-gray-600" />
                    </div>
                    <p className="text-center font-medium text-lg text-gray-400">
                      Sem horários livres
                    </p>
                    <p className="text-center text-sm mt-1 text-gray-600">
                      Tente selecionar outro dia no calendário.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4 ring-1 ring-white/5">
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            className="hover:bg-white/5"
          >
            <ChevronLeft size={16} className="mr-2" /> Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!date || !timeSlot || isLoadingTimes}
            className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Confirmar e Avançar <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};