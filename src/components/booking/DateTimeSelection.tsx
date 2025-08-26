import React, { useState, useEffect, useCallback } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Appointment } from '../../types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../Calendar.css'; // Seu CSS customizado
import { Loader2 } from 'lucide-react';

// Tipos para o calendário e horários
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];
interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'break' | 'past';
}

const DateTimeSelection = () => {
  // Pega todo o estado e ações necessárias do store
  const {
    selectedProfessional,
    selectedDate,
    selectedTime,
    totalDuration,
    setDate,
    setTime,
  } = useBookingStore();

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  // Lógica para buscar os horários disponíveis
  const fetchAvailableTimes = useCallback(async () => {
    setTimeSlots([]);
    setAvailabilityMessage("");

    if (!selectedDate || Array.isArray(selectedDate) || !selectedProfessional || totalDuration === 0) {
      return;
    }

    setLoadingTimes(true);
    try {
      const dayKey = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const dayAvailability = selectedProfessional.availability?.find(d => d.dayOfWeek.toLowerCase() === dayKey);

      if (!dayAvailability || dayAvailability.isDayOff) {
        setAvailabilityMessage("O profissional não atende neste dia.");
        return;
      }

      const q = query(
        collection(db, "appointments"),
        where("professionalId", "==", selectedProfessional.id),
        where("date", "==", selectedDate.toISOString().split("T")[0])
      );
      const querySnapshot = await getDocs(q);
      const bookedIntervals: { start: Date; end: Date }[] = [];
      querySnapshot.forEach(doc => {
        const app = doc.data() as Appointment;
        const appDate = new Date(`${app.date}T${app.startTime}`);
        const appEndDate = new Date(appDate.getTime() + app.duration * 60000);
        bookedIntervals.push({ start: appDate, end: appEndDate });
      });

      const slots = generateTimeSlots(
        dayAvailability.workIntervals,
        dayAvailability.breakIntervals,
        bookedIntervals,
        totalDuration,
        selectedDate
      );
      
      setTimeSlots(slots);
      if (slots.filter(s => s.status === 'available').length === 0) {
        setAvailabilityMessage("Não há horários disponíveis para esta seleção.");
      }

    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setAvailabilityMessage("Erro ao carregar horários.");
    } finally {
      setLoadingTimes(false);
    }
  }, [selectedDate, selectedProfessional, totalDuration]);

  useEffect(() => {
    fetchAvailableTimes();
  }, [fetchAvailableTimes]);

  // Lógica para gerar os slots de horário (movida para cá)
  const generateTimeSlots = (
    workIntervals: { start: string; end: string }[],
    breakIntervals: { start: string; end: string }[],
    bookedIntervals: { start: Date; end: Date }[],
    serviceDuration: number,
    date: Date
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    workIntervals.forEach(work => {
      let currentTime = new Date(`${date.toISOString().split('T')[0]}T${work.start}`);
      const endTime = new Date(`${date.toISOString().split('T')[0]}T${work.end}`);

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        if (slotEnd > endTime) break;

        const timeString = slotStart.toTimeString().substring(0, 5);
        let status: TimeSlot['status'] = 'available';

        if (isToday && slotStart < now) {
          status = 'past';
        } else if (bookedIntervals.some(b => slotStart < b.end && slotEnd > b.start)) {
          status = 'booked';
        } else if (breakIntervals.some(b => {
            const breakStart = new Date(`${date.toISOString().split('T')[0]}T${b.start}`);
            const breakEnd = new Date(`${date.toISOString().split('T')[0]}T${b.end}`);
            return slotStart < breakEnd && slotEnd > breakStart;
        })) {
            status = 'break';
        }
        
        slots.push({ time: timeString, status });
        currentTime.setMinutes(currentTime.getMinutes() + 15); // Intervalo de 15 min para verificar o próximo slot
      }
    });
    return slots;
  };

  const getButtonClass = (status: TimeSlot["status"], time: string) => {
    let baseClasses = "p-3 rounded-lg font-semibold transition-colors duration-200";
    if (status === "available") {
      return selectedTime === time
        ? `${baseClasses} bg-[#daa520] text-gray-900 shadow-md`
        : `${baseClasses} bg-gray-700 hover:bg-gray-600 text-white`;
    }
    return `${baseClasses} bg-gray-800 text-gray-500 cursor-not-allowed opacity-60`;
  };

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">3. Escolha a Data e Hora</h2>
      <div className="flex justify-center mb-6">
        <Calendar
          onChange={setDate}
          value={selectedDate}
          minDate={new Date()}
          className="react-calendar border-2 border-gray-700 rounded-xl shadow-lg"
        />
      </div>
      <h3 className="text-xl font-bold text-white mb-4">Horários Disponíveis</h3>
      {loadingTimes ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
          <p className="text-gray-400 ml-3">A carregar horários...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {timeSlots.length > 0 && timeSlots.some(s => s.status === 'available') ? (
            timeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.status === "available" && setTime(slot.time)}
                disabled={slot.status !== "available"}
                className={getButtonClass(slot.status, slot.time)}
              >
                {slot.time}
              </button>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">
              {availabilityMessage || "Não há horários disponíveis para este dia."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimeSelection;
