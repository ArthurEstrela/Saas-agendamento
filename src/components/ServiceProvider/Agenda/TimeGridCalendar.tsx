// src/components/ServiceProvider/Agenda/AgendaCalendario.tsx

import { useMemo } from 'react';
import { format, isSameDay, addDays, startOfWeek, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, DollarSign, CheckCircle, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils/cn'; // Função utilitária
import { useProviderAppointmentsStore, type EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore';

// === CONFIGURAÇÃO DE LAYOUT DO GRID ===
const START_HOUR = 8;        // 08:00
const END_HOUR = 21;         // 21:00
const HOURS_IN_DAY = END_HOUR - START_HOUR; // 13 horas
const SLOT_DURATION_MINUTES = 15; // Granularidade da linha de grade
const PIXELS_PER_HOUR = 120; // Altura de 1 hora
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60; 
const GRID_HEIGHT = HOURS_IN_DAY * PIXELS_PER_HOUR; 
const TIME_COLUMN_WIDTH = '5rem'; // 80px para a coluna de horários

// === FUNÇÕES DE POSICIONAMENTO ===

const getTopPosition = (date: Date): number => {
    const minutesFromStart = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
    if (minutesFromStart < 0) return 0; 
    return minutesFromStart * PIXELS_PER_MINUTE;
};

const getHeight = (start: Date, end: Date): number => {
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    return Math.max(durationMinutes * PIXELS_PER_MINUTE, 20); 
};

const generateTimeSlots = (): { label: string, top: number }[] => {
    const slots: { label: string, top: number }[] = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
        const baseDate = new Date(0, 0, 0, i, 0);
        
        if (i < END_HOUR) {
             slots.push({
                label: format(baseDate, 'HH:mm'),
                top: getTopPosition(baseDate)
            });
        }

        const halfHourDate = new Date(0, 0, 0, i, 30);
        if (i < END_HOUR - 1) { 
            slots.push({
                label: format(halfHourDate, 'HH:mm'),
                top: getTopPosition(halfHourDate)
            });
        }
    }
    return slots;
};

// === COMPONENTE DO CARD DE AGENDAMENTO (CustomEventCard) ===
interface CustomEventCardProps {
    appointment: EnrichedProviderAppointment;
}

const CustomEventCard = motion(({ appointment }: CustomEventCardProps) => {
    const { setSelectedAppointment } = useProviderAppointmentsStore();
    const appt = appointment;

    const isPending = appt.status === 'pending';
    const isCompleted = appt.status === 'completed';
    const isPast = !isPending && !isCompleted && !isFuture(appt.startTime);
    
    const top = getTopPosition(appt.startTime);
    const height = getHeight(appt.startTime, appt.endTime);

    const statusClasses = cn(
        "bg-amber-800/80 border-amber-500", 
        isPending && "bg-blue-800/80 border-blue-500",
        isCompleted && "bg-green-800/80 border-green-500",
        isPast && "bg-gray-700/80 border-gray-500 opacity-60"
    );

    const Icon = isPending ? MoreHorizontal : isCompleted ? CheckCircle : Clock;
    const isSmall = height < 45;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedAppointment(appt)}
            style={{ 
                top: `${top}px`, 
                height: `${height}px`,
                // Usamos 100% da largura da coluna - 8px de margem (4px de cada lado)
                width: 'calc(100% - 8px)', 
                marginLeft: '4px' 
            }}
            className={cn(
                "absolute p-2 text-xs text-white rounded-lg overflow-hidden cursor-pointer z-10",
                "shadow-lg hover:shadow-xl hover:ring-2 ring-offset-2 ring-offset-gray-900",
                "border-l-4 transition-all duration-300",
                "flex flex-col justify-between",
                statusClasses
            )}
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-1 font-bold truncate text-sm">
                    <Icon size={isSmall ? 10 : 12} className="text-white shrink-0" />
                    <span className={cn(isSmall && "text-xs")}>
                        {appt.services.length > 1 ? `${appt.services[0].name} +${appt.services.length - 1}` : appt.services[0].name}
                    </span>
                </div>
                
                {!isSmall && (
                    <p className="flex items-center gap-1 text-gray-200 mt-1 truncate">
                        <User size={12} className="text-gray-300 shrink-0" />
                        <span className="truncate">{appt.client?.name || 'Cliente Desconhecido'}</span>
                    </p>
                )}
            </div>

            <div className={cn(
                "flex items-center justify-between text-gray-300",
                isSmall ? "text-[10px] mt-0" : "text-xs mt-1"
            )}>
                <span className="font-semibold">{format(appt.startTime, 'HH:mm')} - {format(appt.endTime, 'HH:mm')}</span>
                <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                    <DollarSign size={10} /> {appt.totalPrice.toFixed(2).replace('.', ',')}
                </span>
            </div>
        </motion.div>
    );
})

// EXPORTAÇÃO CORRETA: Renomeia o componente para evitar conflitos no import
export const TimeGridCalendar = ({ appointments, currentDate }: TimeGridCalendarProps) => {

    const timeSlots = useMemo(generateTimeSlots, []);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 0, locale: ptBR }); 
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    const appointmentsByDay = useMemo(() => {
        const map = new Map<string, EnrichedProviderAppointment[]>();
        weekDays.forEach(day => map.set(format(day, 'yyyy-MM-dd'), []));

        appointments.forEach(appt => {
            const dayKey = format(appt.startTime, 'yyyy-MM-dd');
            const hour = appt.startTime.getHours();
            if (hour >= START_HOUR && hour < END_HOUR) {
                 map.get(dayKey)?.push(appt);
            }
        });
        return map;
    }, [appointments, weekDays]);


    return (
        <div 
            className="flex h-full border border-gray-800 rounded-xl bg-gray-900 shadow-2xl overflow-hidden" 
            style={{ minHeight: '600px' }}
        >
            {/* 1. Coluna de Horários (Sticky Left e Top) */}
            <div 
                className="bg-gray-900 border-r border-gray-800 sticky left-0 z-30 flex flex-col"
                style={{ width: TIME_COLUMN_WIDTH }}
            >
                {/* Canto superior esquerdo - Fixado */}
                <div className="h-12 bg-gray-900 border-b border-gray-800 shrink-0 sticky top-0 z-30"></div> 
                
                {/* Etiquetas de Tempo */}
                <div style={{ height: `${GRID_HEIGHT}px` }} className="relative shrink-0">
                    {timeSlots.map(({ label, top }, index) => (
                        <div
                            key={index}
                            className="absolute text-xs text-gray-500 pr-2 transform -translate-y-1/2 w-full text-right pointer-events-none font-medium"
                            style={{ top: `${top}px` }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Grid de Dias e Conteúdo (ÁREA DE SCROLL PRINCIPAL) */}
            <div className="flex-1 overflow-x-auto">
                <div className="relative" style={{ width: `${7 * 100}%`, minWidth: '100%' }}>
                    
                    {/* CABEÇALHO DOS DIAS (Sticky Top) */}
                    <div className="flex w-full sticky top-0 z-20 bg-gray-900 shadow-md border-b border-gray-800">
                        {weekDays.map((day, index) => (
                            <div 
                                key={index} 
                                className={cn(
                                    "flex-1 p-3 text-center transition-colors duration-200",
                                    "font-semibold text-sm",
                                    isSameDay(day, new Date()) ? "text-amber-500 bg-gray-800/50" : "text-gray-300"
                                )}
                            >
                                <span className="block text-xs uppercase text-gray-400">{format(day, 'EEE', { locale: ptBR })}</span>
                                <span className="block text-xl font-bold">{format(day, 'dd')}</span>
                                <span className="block text-xs text-gray-500">{format(day, 'MMM', { locale: ptBR })}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* CORPO DO GRID DE AGENDAMENTOS */}
                    <div 
                        className="relative flex w-full" 
                        style={{ height: `${GRID_HEIGHT}px` }}
                    >
                        {weekDays.map((day, dayIndex) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const dailyAppointments = appointmentsByDay.get(dayKey) || [];

                            return (
                                <div
                                    key={dayIndex}
                                    className={cn(
                                        "relative flex-1 border-r border-gray-800",
                                        isSameDay(day, new Date()) && "bg-gray-900/50"
                                    )}
                                >
                                    {/* Linhas de Grade Horizontal (Grade de Fundo) */}
                                    {/* Usa slotIndex % 4 === 0 para marcar a hora cheia (linhas mais grossas) */}
                                    {Array.from({ length: HOURS_IN_DAY * 4 }, (_, slotIndex) => (
                                        <div
                                            key={slotIndex}
                                            className={cn(
                                                "w-full absolute left-0 border-t border-gray-800/50 pointer-events-none",
                                                (slotIndex % 4 === 0) ? "border-t border-gray-700" : "border-dashed border-gray-900/50" 
                                            )}
                                            style={{ top: `${(slotIndex * (SLOT_DURATION_MINUTES * PIXELS_PER_MINUTE))}px`, height: `${SLOT_DURATION_MINUTES * PIXELS_PER_MINUTE}px` }}
                                        />
                                    ))}

                                    {/* Renderiza os Agendamentos */}
                                    {dailyAppointments.map(appt => (
                                        <CustomEventCard 
                                            key={appt.id} 
                                            appointment={appt} 
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};