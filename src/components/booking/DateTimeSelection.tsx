import { useState, useEffect, useMemo, useCallback } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { getAppointmentsForProfessionalOnDate } from "../../firebase/bookingService";
import { ptBR } from "date-fns/locale";
import { format, isToday, set, startOfDay } from "date-fns";
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
import { Badge } from "../ui/badge";

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
        setTimeSlot(null); // Resetar seleção ao mudar data
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
      className="pb-24"
    >
      <div className="text-center mb-8">
        <Typography variant="h2">Data e Horário</Typography>
        <Typography variant="muted">
          Quando você gostaria de ser atendido?
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto px-2">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg w-full max-w-[350px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={ptBR}
              disabled={{ before: new Date() }}
              className="w-full"
            />
          </div>
        </div>

        {/* Coluna dos Horários */}
        <div className="lg:col-span-7">
          <Card className="h-full bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                <Badge
                  variant="secondary"
                  className="h-10 w-10 rounded-full flex items-center justify-center p-0"
                >
                  <Clock size={20} className="text-primary" />
                </Badge>
                <div>
                  <h3 className="font-bold text-gray-100">
                    {date
                      ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : "Selecione uma data"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {date
                      ? `${availableTimes.length} horários disponíveis`
                      : "Aguardando seleção"}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-[300px]">
                {isLoadingTimes ? (
                  <div className="h-full flex flex-col items-center justify-center text-primary">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <span className="text-sm">Buscando disponibilidade...</span>
                  </div>
                ) : !date ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <ChevronLeft size={48} className="mb-2" />
                    <span className="text-sm">
                      Selecione uma data no calendário
                    </span>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 content-start">
                    {availableTimes.map((slot) => (
                      <Button
                        key={slot}
                        variant={timeSlot === slot ? "default" : "outline"}
                        onClick={() => setTimeSlot(slot)}
                        className={cn(
                          "h-11 border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-300 font-medium transition-all",
                          timeSlot === slot &&
                            "border-primary bg-primary text-black hover:bg-primary hover:text-black shadow-[0_0_10px_rgba(218,165,32,0.4)] scale-105"
                        )}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <CalendarX size={48} className="mb-4 text-gray-700" />
                    <p className="text-center font-medium">
                      Sem horários livres
                    </p>
                    <p className="text-center text-xs mt-1">
                      Tente selecionar outro dia.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4">
        <div className="max-w-4xl mx-auto bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-4 flex justify-between items-center gap-4">
          <Button variant="ghost" onClick={goToPreviousStep}>
            <ChevronLeft size={16} className="mr-2" /> Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!date || !timeSlot || isLoadingTimes}
            className="w-full sm:w-auto px-8 font-bold"
          >
            Confirmar e Avançar <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
