// src/components/booking/DateTimeSelection.tsx

import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../Calendar.css';
import { addMinutes, format, getDay, isEqual, parse, startOfDay, isToday } from 'date-fns'; // Importa o isToday
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import useBookingProcessStore from '../../store/bookingProcessStore';

const convertToDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const DateTimeSelection = () => {
  const {
    serviceProvider,
    selectedServices,
    selectedDate,
    selectedTime,
    setDate,
    setTime,
  } = useBookingProcessStore();
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDate(startOfDay(date));
      setTime(null);
    }
  };

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, service) => acc + service.duration, 0);
  }, [selectedServices]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !serviceProvider?.availability?.weekdays) {
      return [];
    }
    
    // Pega a data e hora atuais para comparação
    const now = new Date();
    // Verifica se a data selecionada no calendário é o dia de hoje
    const isSelectedDateToday = isToday(selectedDate);

    const dayOfWeek = getDay(selectedDate);
    const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayMapping[dayOfWeek] as keyof typeof serviceProvider.availability.weekdays;
    const daySchedule = serviceProvider.availability.weekdays[dayName];

    if (!daySchedule || !daySchedule.isOpen) {
      return [];
    }

    try {
        const startTime = parse(daySchedule.startTime, 'HH:mm', selectedDate);
        const endTime = parse(daySchedule.endTime, 'HH:mm', selectedDate);
        
        const bookingsForDay = (serviceProvider.bookings || [])
          .map(booking => {
            const bookingDate = convertToDate(booking.date);
            if (!bookingDate || !isEqual(startOfDay(bookingDate), selectedDate)) return null;
            return {
              ...booking,
              startDate: bookingDate,
            };
          })
          .filter((b): b is NonNullable<typeof b> => b !== null);

        const slots = [];
        let currentTime = startTime;

        while (addMinutes(currentTime, totalDuration) <= endTime) {
            // ----> A NOVA LÓGICA ESTÁ AQUI <----
            // Se o dia selecionado é hoje, verifica se o horário já passou.
            // Se já passou, simplesmente pula para a próxima iteração do loop.
            if (isSelectedDateToday && currentTime < now) {
                currentTime = addMinutes(currentTime, serviceProvider.availability.slotInterval || 15);
                continue; // Pula este horário
            }

            const slotEnd = addMinutes(currentTime, totalDuration);

            const isOccupied = bookingsForDay.some(booking => {
              const bookingStart = booking.startDate;
              const bookingEnd = addMinutes(bookingStart, booking.totalDuration);
              return (currentTime < bookingEnd) && (slotEnd > bookingStart);
            });

            if (!isOccupied) {
                slots.push(format(currentTime, 'HH:mm'));
            }
            
            currentTime = addMinutes(currentTime, serviceProvider.availability.slotInterval || 15);
        }
        
        return slots;

    } catch (error) {
        console.error("Erro ao gerar horários:", error);
        return [];
    }
  }, [selectedDate, serviceProvider, totalDuration]);

  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Escolha a Data e Hora</h2>
        <p className="text-gray-400 mt-1">Selecione o melhor dia e horário para você.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 items-start">
        <div className="w-full max-w-sm mx-auto">
          <Calendar
            onChange={(value) => handleDateChange(value as Date)}
            value={selectedDate}
            minDate={new Date()}
            locale="pt-BR"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto pr-2">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={22}/>
            Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : '...'}
          </h3>
          {selectedDate ? (
            availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimeSlots.map(time => (
                  <button key={time} onClick={() => setTime(time)} className={`p-3 rounded-lg font-semibold transition-all duration-200 ${selectedTime === time ? 'bg-[#daa520] text-black shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-10 bg-black/20 rounded-lg">
                <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-3"/>
                <p className="font-semibold text-white">Nenhum horário disponível</p>
                <p className="text-sm">Tente selecionar outro dia.</p>
              </div>
            )
          ) : (
            <div className="text-center text-gray-400 py-10 bg-black/20 rounded-lg">
              <CalendarIcon size={32} className="mx-auto text-gray-500 mb-3"/>
              <p className="font-semibold text-white">Selecione uma data</p>
              <p className="text-sm">Escolha um dia no calendário para ver os horários.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelection;