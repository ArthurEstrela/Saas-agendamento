// src/components/ServiceProvider/AgendaTimeline.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Users } from 'lucide-react';
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';

interface TimelineEventProps {
  appointment: EnrichedProviderAppointment;
  onSelect: (appt: EnrichedProviderAppointment) => void;
  onUpdateStatus: (id: string, status: 'scheduled' | 'cancelled') => void;
}

// Componente para o card do evento na timeline
const TimelineEventCard = ({ appointment, onSelect, onUpdateStatus }: TimelineEventProps) => {
  const isPending = appointment.status === 'pending';
  const cardHeight = Math.max(appointment.totalDuration, 45); // Altura mínima de 45px
  const topPosition = (appointment.startTime.getHours() * 60) + appointment.startTime.getMinutes();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
      style={{
        top: `${(topPosition / 1440) * 100 * 24}px`, // Posição calculada
        height: `${(cardHeight / 1440) * 100 * 24}px`,
      }}
      className={`absolute left-16 right-0 rounded-lg p-2 text-white flex flex-col justify-start cursor-pointer transition-all duration-300 ease-in-out
        ${isPending
          ? 'bg-gray-700/50 border-2 border-dashed border-yellow-500 z-20'
          : 'bg-gray-900 border border-gray-700 hover:bg-gray-800 z-10'
      }`}
      onClick={() => !isPending && onSelect(appointment)}
    >
      <p className="font-bold text-sm truncate">{appointment.services.map(s => s.name).join(', ')}</p>
      <p className="text-xs text-gray-400 truncate">{appointment.client?.name}</p>
      
      {isPending && (
         <div className="mt-auto pt-2 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment.id, 'cancelled'); }}
              className="text-xs bg-red-500/20 text-red-400 w-full py-1 rounded hover:bg-red-500/40"
            >
              Recusar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment.id, 'scheduled'); }}
              className="text-xs bg-green-500/20 text-green-400 w-full py-1 rounded hover:bg-green-500/40"
            >
              Aceitar
            </button>
         </div>
      )}
    </motion.div>
  );
};


export const AgendaTimeline = ({ appointments, onSelectAppointment, onUpdateStatus }: {
  appointments: EnrichedProviderAppointment[];
  onSelectAppointment: (appt: EnrichedProviderAppointment) => void;
  onUpdateStatus: (id: string, status: 'scheduled' | 'cancelled') => void;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative">
      {/* Linhas de Hora */}
      {hours.map((hour) => (
        <div key={hour} className="h-24 flex items-start border-t border-gray-800">
          <span className="text-sm text-gray-500 -translate-y-1/2 pr-4">
            {format(new Date(0, 0, 0, hour), 'HH:mm')}
          </span>
        </div>
      ))}

      {/* Eventos */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {appointments.map((appt) => (
            <TimelineEventCard 
                key={appt.id} 
                appointment={appt} 
                onSelect={onSelectAppointment} 
                onUpdateStatus={onUpdateStatus}
            />
          ))}
        </AnimatePresence>
      </div>

      {appointments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-600"
        >
          <Users size={48} />
          <p className="mt-4 font-semibold">Nenhum evento para hoje</p>
          <p className="text-sm">Sua agenda está livre neste dia.</p>
        </motion.div>
      )}
    </div>
  );
};