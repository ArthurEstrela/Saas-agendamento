import { useState, useEffect, useMemo, useCallback } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { getAppointmentsForProfessionalOnDate } from "../../firebase/bookingService";
import { ptBR } from "date-fns/locale";
import { format, isToday, set, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Loader2, CalendarX } from "lucide-react";
import type { DailyAvailability } from "../../types";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Calendar } from "../ui/calendar"; // Usando seu primitivo de Calendário!
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";

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
    selectedProfessional,
    selectedServices,
    selectedDate,
    selectedTimeSlot,
    selectDateAndTime,
    goToPreviousStep,
  } = useBookingProcessStore();

  const today = startOfDay(new Date());
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
          currentTime = new Date(currentTime.getTime() + 15 * 60000);
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
    setTimeSlot(null);
  };

  const handleConfirm = () => {
    if (date && timeSlot) {
      selectDateAndTime(date, timeSlot);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Typography variant="h2" className="text-center mb-8">
        Escolha a Data e Hora
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto bg-black/30 p-8 rounded-2xl">
        <div className="flex justify-center items-start">
          {/* Componente Calendar do Shadcn/UI */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            locale={ptBR}
            disabled={{ before: new Date() }}
            className="rounded-md border border-gray-700 bg-gray-800"
          />
        </div>

        <div className="flex flex-col min-h-[350px]">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Clock size={20} /> Horários para{" "}
            {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "..."}
          </h3>

          {isLoadingTimes ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : availableTimes.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto max-h-72 pr-2 scrollbar-thin">
              {availableTimes.map((slot) => (
                <Button
                  key={slot}
                  variant={timeSlot === slot ? "default" : "secondary"}
                  onClick={() => setTimeSlot(slot)}
                  className={cn(
                    "w-full transition-all",
                    timeSlot === slot &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-gray-900 scale-105"
                  )}
                >
                  {slot}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-800/50 rounded-lg p-4">
              <CalendarX size={32} className="text-gray-500 mb-2" />
              <Typography className="font-semibold">
                Nenhum horário disponível
              </Typography>
              <Typography variant="muted">
                {date
                  ? "Tente selecionar outra data."
                  : "Selecione uma data para ver os horários."}
              </Typography>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-8">
        <Button variant="secondary" onClick={goToPreviousStep}>
          Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!date || !timeSlot || isLoadingTimes}
          className="w-48"
        >
          {isLoadingTimes ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            "Avançar"
          )}
        </Button>
      </div>
    </motion.div>
  );
};
