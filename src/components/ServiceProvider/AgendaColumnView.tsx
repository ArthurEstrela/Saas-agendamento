// src/components/ServiceProvider/AgendaColumnView.tsx
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { Users } from 'lucide-react';

const getWorkingHours = (
  provider: ServiceProviderProfile,
  viewingDate: Date,
  selectedProfessionalId: string
) => {
  const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayOfWeekNames[viewingDate.getDay()];

  let relevantProfessionals = provider.professionals || [];
  if (selectedProfessionalId !== 'all') {
    relevantProfessionals = provider.professionals.filter(p => p.id === selectedProfessionalId);
  }

  const allSlots = relevantProfessionals.flatMap(prof => {
    const dayAvailability = prof.availability?.find(a => a.dayOfWeek === dayOfWeek);
    return dayAvailability && dayAvailability.isAvailable ? dayAvailability.slots : [];
  });

  if (allSlots.length === 0) {
    // Se não houver horários definidos, retorna um padrão
    return { startHour: 8, endHour: 20 };
  }

  const startTimes = allSlots.map(slot => parseInt(slot.start.split(':')[0]));
  const endTimes = allSlots.map(slot => parseInt(slot.end.split(':')[0]));

  // Adiciona 1h no final para o visual não ficar cortado
  const earliestHour = Math.min(...startTimes);
  const latestHour = Math.max(...endTimes);

  return {
    startHour: Math.max(0, earliestHour - 1), // Garante que não seja negativo
    endHour: Math.min(23, latestHour + 1),   // Garante que não passe de 23
  };
};

const getEventGridPosition = (appointment: EnrichedProviderAppointment, startHour: number, endHour: number) => {
  const totalMinutesInView = (endHour - startHour) * 60;
  const start = appointment.startTime;
  const end = appointment.endTime;

  const topOffset = ((start.getHours() - startHour) * 60) + start.getMinutes();
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);

  const topPercent = (topOffset / totalMinutesInView) * 100;
  const heightPercent = (duration / totalMinutesInView) * 100;

  return { top: `${topPercent}%`, height: `${heightPercent}%` };
};

export const AgendaColumnView = ({
  appointments,
  provider,
  viewingDate,
  selectedProfessionalId,
}: {
  appointments: EnrichedProviderAppointment[];
  provider: ServiceProviderProfile; // <<< PROP ADICIONADA
  viewingDate: Date; // <<< PROP ADICIONADA
  selectedProfessionalId: string; // <<< PROP ADICIONADA
}) => {

  // <<< INÍCIO DA ALTERAÇÃO: USA A FUNÇÃO INTELIGENTE
  const { startHour, endHour } = useMemo(() =>
    getWorkingHours(provider, viewingDate, selectedProfessionalId),
    [provider, viewingDate, selectedProfessionalId]
  );

   const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
 if (startHour >= endHour) {
    return (
       <div className="flex flex-col h-full items-center justify-center text-center text-gray-600">
         <Users size={48} />
         <p className="mt-4 font-semibold">Nenhum horário de trabalho definido</p>
         <p className="text-sm">Vá para "Disponibilidade" e configure os horários para este dia.</p>
       </div>
    );
  }
return (
    <div className="relative h-full">
      <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length - 1}, minmax(4rem, 1fr))` }}>
        {hours.slice(0, -1).map(hour => (
          <div key={hour} className="relative border-t border-gray-800">
            <span className="absolute -top-3 left-2 text-xs text-gray-500 bg-black px-1">
              {format(new Date(0, 0, 0, hour), 'HH:mm')}
            </span>
          </div>
        ))}
      </div>

  <div className="absolute top-0 left-16 right-0 bottom-0">
        <AnimatePresence>
          {appointments.map(appt => (
            <motion.div
              key={appt.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={getEventGridPosition(appt, startHour, endHour)} // <<< USA AS HORAS DINÂMICAS
              className="absolute w-full p-2 rounded-lg text-white cursor-pointer"
            >
              <div className={`h-full p-3 rounded-lg flex flex-col bg-amber-800/50 border-l-4 border-amber-500`}>
                  <p className="font-bold text-sm truncate">{appt.services.map(s => s.name).join(', ')}</p>
                  <p className="text-xs text-amber-200 truncate">{appt.client?.name}</p>
                  <p className="text-xs text-amber-300 mt-auto">{format(appt.startTime, 'HH:mm')} - {format(appt.endTime, 'HH:mm')}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

  {appointments.length === 0 && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-600">
           <Users size={48} />
           <p className="mt-4 font-semibold">Nenhum agendamento encontrado</p>
           <p className="text-sm">Tente ajustar os filtros ou aproveite o dia livre!</p>
         </div>
      )}
    </div>
  );
};