// src/components/booking/DateTimeSelection.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
// ... outras importações
import { getAppointmentsForProfessionalOnDate } from "../../firebase/bookingService";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ptBR } from "date-fns/locale";
import { format, isToday, set, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Loader2, CalendarX } from "lucide-react";
import type { DailyAvailability } from "../../types";

const weekDayMap: { [key: number]: DailyAvailability["dayOfWeek"] } = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"};

export const DateTimeSelection = () => {
    // ✅ Nomes atualizados para corresponder ao novo store
  const {
    selectedProfessional, // Renomeado para consistência
    selectedServices,
    selectedDate,
    selectedTimeSlot,
    selectDateAndTime,
    goToPreviousStep,
  } = useBookingProcessStore();

  const today = startOfDay(new Date());
  // ✅ Lógica inicial da data já estava ótima
  const initialDate = selectedDate && new Date(selectedDate) >= today ? new Date(selectedDate) : undefined;

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [timeSlot, setTimeSlot] = useState<string | null>(selectedTimeSlot);
  // ... (o resto dos seus hooks useState, useMemo, useCallback e useEffect permanecem os mesmos)
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(true);
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, service) => acc + service.duration, 0);
  }, [selectedServices]);

  const generateAvailableSlots = useCallback(
    async (selectedDay: Date) => {
      if (!selectedProfessional) return;

      setIsLoadingTimes(true);
      setAvailableTimes([]);

      const dayOfWeek = weekDayMap[selectedDay.getDay()];
      const dayAvailability = selectedProfessional.availability.find(
        (a) => a.dayOfWeek === dayOfWeek
      );

      if (!dayAvailability || !dayAvailability.isAvailable) {
        setIsLoadingTimes(false);
        return;
      }
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
      setAvailableTimes(slots);
      setIsLoadingTimes(false);
    },
    [selectedProfessional, totalDuration]
  );
    
    useEffect(() => {
        if (date instanceof Date) {
            generateAvailableSlots(date);
        } else {
            setIsLoadingTimes(false);
            setAvailableTimes([]);
        }
    }, [date, generateAvailableSlots]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) setDate(startOfDay(newDate));
    else setDate(undefined);
    setTimeSlot(null);
  };

  const handleConfirm = () => {
    if (date && timeSlot) {
        // ✅ Usando a nova ação
      selectDateAndTime(date, timeSlot);
    }
  };
  
  // ✅ Seu JSX está perfeito, nenhuma mudança necessária aqui.
  // ...
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold text-center text-white mb-8">
                Escolha a Data e Hora
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto bg-black/30 p-8 rounded-2xl">
                <div className="flex justify-center items-center">
                    <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        locale={ptBR}
                        fromDate={new Date()}
                        disabled={{ before: new Date() }}
                    />
                </div>
                <div className="flex flex-col min-h-[350px]">
                    <h3 className="text-xl font-semibold text-[#daa520] mb-4 flex items-center gap-2">
                        <Clock size={20} /> Horários para{" "}
                        {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "..."}
                    </h3>
                    {isLoadingTimes ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#daa520]" size={40} />
                        </div>
                    ) : availableTimes.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto max-h-72 pr-2">
                            {availableTimes.map((slot) => (
                                <button
                                    key={slot}
                                    onClick={() => setTimeSlot(slot)}
                                    className={`p-3 rounded-lg font-semibold transition-all duration-200 text-center ${
                                        timeSlot === slot
                                            ? "bg-[#daa520] text-gray-900 ring-2 ring-offset-2 ring-offset-gray-800 ring-amber-400 transform scale-105"
                                            : "bg-gray-700 text-white hover:bg-gray-600 hover:scale-105"
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-800/50 rounded-lg p-4">
                            <CalendarX size={32} className="text-gray-500 mb-2" />
                            <p className="font-semibold text-white">
                                Nenhum horário disponível
                            </p>
                            <p className="text-sm text-gray-400">
                                {date ? "Tente selecionar outra data." : "Selecione uma data para ver os horários."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-center items-center gap-4 mt-8">
                <button onClick={goToPreviousStep} className="secondary-button">
                    Voltar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!date || !timeSlot || isLoadingTimes}
                    className="primary-button w-48"
                >
                    {isLoadingTimes ? <Loader2 className="animate-spin mx-auto" /> : "Avançar"}
                </button>
            </div>
        </motion.div>
    );
};