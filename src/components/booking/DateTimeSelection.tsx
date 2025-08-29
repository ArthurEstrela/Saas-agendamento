// src/components/booking/DateTimeSelection.tsx

import React, { useMemo, useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilo padrão
import '../../Calendar.css'; // Seu CSS customizado para o calendário
import { addMinutes, format, getDay, isEqual, parse, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
const DateTimeSelection = () => {
  const {
    serviceProvider,
    selectedServices,
    selectedDate,
    selectedTime,
    setDate,
    setTime,
  } = useBookingStore();
  
  // Reseta a hora selecionada sempre que a data muda
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDate(startOfDay(date)); // Garante que a data não tenha horas/minutos
      setTime(null);
    }
  };

  // --- CÁLCULOS E LÓGICA ---

  // 1. Calcula a duração total dos serviços selecionados
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, service) => acc + service.duration, 0);
  }, [selectedServices]);

  // 2. Gera os horários disponíveis para o dia selecionado
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !serviceProvider?.availability) {
      return [];
    }

    // Mapeia o dia da semana (domingo = 0, segunda = 1, etc.)
    const dayOfWeek = getDay(selectedDate);
    const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayMapping[dayOfWeek] as keyof typeof serviceProvider.availability.weekdays;

    const daySchedule = serviceProvider.availability.weekdays[dayName];

    // Se o estabelecimento está fechado, retorna uma lista vazia
    if (!daySchedule || !daySchedule.isOpen) {
      return [];
    }

    // Converte os horários de início e fim para objetos Date
    const startTime = parse(daySchedule.startTime, 'HH:mm', selectedDate);
    const endTime = parse(daySchedule.endTime, 'HH:mm', selectedDate);
    
    // Filtra os agendamentos existentes para o dia selecionado
    const bookingsForDay = serviceProvider.bookings?.filter(booking => 
        isEqual(startOfDay(new Date(booking.date)), selectedDate)
    ) || [];

    const slots = [];
    let currentTime = startTime;

    // Gera os horários desde a abertura até o fechamento
    while (addMinutes(currentTime, totalDuration) <= endTime) {
      const slotEnd = addMinutes(currentTime, totalDuration);

      // Verifica se o horário atual conflita com algum agendamento existente
      const isOccupied = bookingsForDay.some(booking => {
        const bookingStart = new Date(booking.date);
        const bookingEnd = addMinutes(bookingStart, booking.totalDuration);
        // Conflito existe se: (SlotStart < BookingEnd) e (SlotEnd > BookingStart)
        return (currentTime < bookingEnd) && (slotEnd > bookingStart);
      });

      if (!isOccupied) {
        slots.push(format(currentTime, 'HH:mm'));
      }
      
      // Incrementa o tempo pelo intervalo definido (ex: 15 minutos)
      currentTime = addMinutes(currentTime, serviceProvider.availability.slotInterval || 15);
    }

    return slots;
  }, [selectedDate, serviceProvider, totalDuration]);

  // --- RENDERIZAÇÃO ---
  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Escolha a Data e Hora</h2>
        <p className="text-gray-400 mt-1">Selecione o melhor dia e horário para você.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Lado Esquerdo: Calendário */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-sm">
            <Calendar
              onChange={(value) => handleDateChange(value as Date)}
              value={selectedDate}
              minDate={new Date()} // Impede a seleção de datas passadas
              locale="pt-BR"
              tileClassName={({ date, view }) => 
                view === 'month' && date.getDay() === 0 ? 'sunday-tile' : ''
              }
            />
          </div>
        </div>

        {/* Lado Direito: Horários Disponíveis */}
        <div className="max-h-[40vh] overflow-y-auto pr-2">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={22}/>
            Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : '...'}
          </h3>

          {selectedDate ? (
            availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setTime(time)}
                    className={`p-3 rounded-lg font-semibold transition-all duration-200 ${
                      selectedTime === time
                        ? 'bg-[#daa520] text-black shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
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