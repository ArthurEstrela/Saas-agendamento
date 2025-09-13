import { useState, useEffect, useMemo } from 'react';
import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { getAppointmentsForProfessionalOnDate } from '../../firebase/bookingService';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import '../../Calendar.css';
import { ptBR } from 'date-fns/locale';
import { format, isToday, setHours, setMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Loader2, CalendarX } from 'lucide-react';
import type { Appointment, DailyAvailability } from '../../types';

const weekDayMap: { [key: number]: DailyAvailability['dayOfWeek'] } = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

export const DateTimeSelection = () => {
    const { 
        professional,
        selectedServices,
        date: selectedDate, 
        timeSlot: selectedTime, 
        selectDateTime, 
        goToNextStep, 
        goToPreviousStep 
    } = useBookingProcessStore();
    
    const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
    const [timeSlot, setTimeSlot] = useState<string | null>(selectedTime);
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [isLoadingTimes, setIsLoadingTimes] = useState(false);

    // Calcula a duração total dos serviços selecionados
    const totalDuration = useMemo(() => {
        return selectedServices.reduce((acc, service) => acc + service.duration, 0);
    }, [selectedServices]);

    useEffect(() => {
        if (!date || !professional) return;

        const generateAvailableSlots = async () => {
            setIsLoadingTimes(true);
            
            // 1. Encontra a regra de disponibilidade para o dia da semana selecionado
            const dayOfWeek = weekDayMap[date.getDay()];
            const dayAvailability = professional.availability.find(a => a.dayOfWeek === dayOfWeek);

            // Se o profissional não trabalha nesse dia, retorna vazio
            if (!dayAvailability || !dayAvailability.isAvailable) {
                setAvailableTimes([]);
                setIsLoadingTimes(false);
                return;
            }

            // 2. Busca agendamentos já existentes para este profissional nesta data
            const existingAppointments = await getAppointmentsForProfessionalOnDate(professional.id, date);

            const slots: string[] = [];
            const now = new Date();

            // 3. Itera sobre os intervalos de trabalho do profissional (ex: 09:00-12:00 e 14:00-18:00)
            for (const workSlot of dayAvailability.slots) {
                let currentTime = setMinutes(setHours(new Date(date), parseInt(workSlot.start.split(':')[0])), parseInt(workSlot.start.split(':')[1]));
                const endTime = setMinutes(setHours(new Date(date), parseInt(workSlot.end.split(':')[0])), parseInt(workSlot.end.split(':')[1]));

                // 4. Gera horários a cada 15 minutos dentro do intervalo de trabalho
                while (currentTime < endTime) {
                    const potentialSlotEnd = new Date(currentTime.getTime() + totalDuration * 60000);

                    // 5. Faz as validações
                    const isPast = isToday(date) && currentTime < now;
                    const fitsInWorkSlot = potentialSlotEnd <= endTime;
                    const isOverlapping = existingAppointments.some(appt =>
                        (currentTime >= appt.startTime && currentTime < appt.endTime) ||
                        (potentialSlotEnd > appt.startTime && potentialSlotEnd <= appt.endTime) ||
                        (currentTime <= appt.startTime && potentialSlotEnd >= appt.endTime)
                    );

                    if (!isPast && fitsInWorkSlot && !isOverlapping) {
                        slots.push(format(currentTime, 'HH:mm'));
                    }

                    // Avança para o próximo slot (intervalo de 15 min)
                    currentTime = new Date(currentTime.getTime() + 15 * 60000); 
                }
            }
            
            setAvailableTimes(slots);
            setIsLoadingTimes(false);
        };

        generateAvailableSlots();
    }, [date, professional, totalDuration]);

    const handleConfirm = () => {
        if (date && timeSlot) {
            selectDateTime(date, timeSlot);
            goToNextStep();
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold text-center text-white mb-8">Escolha a Data e Hora</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto bg-black/30 p-8 rounded-2xl">
                <div className="flex justify-center">
                    <DayPicker mode="single" selected={date} onSelect={setDate} locale={ptBR} fromDate={new Date()} className="text-white"/>
                </div>

                <div className="flex flex-col min-h-[250px]">
                    <h3 className="text-xl font-semibold text-[#daa520] mb-4 flex items-center gap-2">
                        <Clock size={20}/> Horários para {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : '...'}
                    </h3>
                    {isLoadingTimes ? (
                         <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#daa520]" size={40}/></div>
                    ) : availableTimes.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto max-h-64 pr-2">
                            {availableTimes.map((slot) => {
                                const isSelected = timeSlot === slot;
                                return (
                                <button key={slot} onClick={() => setTimeSlot(slot)} className={`p-3 rounded-lg font-semibold transition-all duration-200 text-center ${isSelected ? 'bg-[#daa520] text-gray-900 ring-2 ring-offset-2 ring-offset-gray-800 ring-amber-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                                    {slot}
                                </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-800/50 rounded-lg p-4">
                            <CalendarX size={32} className="text-gray-500 mb-2"/>
                            <p className="font-semibold text-white">Nenhum horário disponível</p>
                            <p className="text-sm text-gray-400">Tente selecionar outra data.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-center items-center gap-4 mt-8">
                <button onClick={goToPreviousStep} className="secondary-button">Voltar</button>
                <button onClick={handleConfirm} disabled={!date || !timeSlot} className="primary-button w-48">
                    Avançar
                </button>
            </div>
        </motion.div>
    );
};