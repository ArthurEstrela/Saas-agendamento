import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../Calendar.css'; // Seu CSS customizado para o calendário
import useBookingProcessStore from '../../store/bookingProcessStore';
import { add, format, parse, areIntervalsOverlapping } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAppointmentsForDate } from '../../firebase/bookingService';

// --- COMPONENTE PRINCIPAL ---
const DateTimeSelection = () => {
  const {
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    serviceProvider,
    selectedServices,
  } = useBookingProcessStore();

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  }, [selectedServices]);

  // CORREÇÃO AQUI: A chamada do useQuery agora é um objeto só
  const { data: existingAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', serviceProvider?.uid, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => getAppointmentsForDate(serviceProvider!.uid, selectedDate),
    enabled: !!serviceProvider,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const availableTimes = useMemo(() => {
    if (!serviceProvider?.availability?.weekdays) {
      return [];
    }

    const dayName = format(selectedDate, 'eeee').toLowerCase();
    const daySchedule = serviceProvider.availability.weekdays[dayName];
    
    if (!daySchedule || !daySchedule.isOpen) {
      return [];
    }
    
    const times = [];
    const slotInterval = serviceProvider.availability.slotInterval || 30;

    let currentTime = parse(daySchedule.startTime, 'HH:mm', selectedDate);
    const lastPossibleTime = parse(daySchedule.endTime, 'HH:mm', selectedDate);

    while (currentTime < lastPossibleTime) {
      const slotStartTime = currentTime;
      const slotEndTime = add(slotStartTime, { minutes: totalDuration });

      if (slotEndTime <= lastPossibleTime) {
        const isOverlapping = existingAppointments?.some(appointment => {
          const appointmentStart = parse(`${appointment.date} ${appointment.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
          const appointmentEnd = add(appointmentStart, { minutes: appointment.duration });
          
          return areIntervalsOverlapping(
            { start: slotStartTime, end: slotEndTime },
            { start: appointmentStart, end: appointmentEnd }
          );
        });

        if (!isOverlapping) {
          times.push(format(slotStartTime, 'HH:mm'));
        }
      }
      
      currentTime = add(currentTime, { minutes: slotInterval });
    }
    return times;
  }, [selectedDate, serviceProvider, totalDuration, existingAppointments]);

  return (
    <div className="animate-fade-in-down grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col items-center">
        <h3 className="text-2xl font-bold text-white mb-4">Selecione uma Data</h3>
        <Calendar
          onChange={(date) => setSelectedDate(date as Date)}
          value={selectedDate}
          locale="pt-BR"
          minDate={new Date()}
          className="bg-transparent border-0"
        />
      </div>

      <div className="flex flex-col items-center w-full">
        <h3 className="text-2xl font-bold text-white mb-4">
          Horários para <span className='text-[#daa520]'>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
        </h3>
        
        {isLoadingAppointments ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#daa520]" size={48} />
            <p className="mt-4 text-gray-400">Buscando horários...</p>
          </div>
        ) : availableTimes.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 w-full">
            {availableTimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`w-full p-3 font-semibold rounded-lg transition-all duration-200 border-2 ${
                  selectedTime === time
                    ? 'bg-[#daa520] text-black border-[#daa500]'
                    : 'bg-gray-800 text-white border-gray-700 hover:border-[#daa520]/80 hover:bg-[#daa520]/10'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-64 bg-black/20 p-6 rounded-lg w-full">
             <CalendarX size={48} className="text-gray-600 mb-4"/>
            <p className="font-semibold text-white">Nenhum horário disponível</p>
            <p className="text-sm text-gray-400">Por favor, tente outra data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeSelection;