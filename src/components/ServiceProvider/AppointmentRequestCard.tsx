// src/components/ServiceProvider/AppointmentRequestCard.tsx
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Calendar, Clock, Scissors, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentRequestCardProps {
  appointment: EnrichedProviderAppointment;
  onAccept: (id: string, status: 'scheduled') => void;
  onReject: (id: string, status: 'cancelled') => void;
}

export const AppointmentRequestCard = ({ appointment, onAccept, onReject }: AppointmentRequestCardProps) => {
  const { client, startTime, services, professionalName } = appointment;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 mb-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
          {client?.profilePictureUrl ? (
            <img src={client.profilePictureUrl} alt={client.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold text-white">{client?.name || 'Cliente'}</h4>
          <p className="text-xs text-gray-400">com {professionalName}</p>
        </div>
      </div>

      <div className="text-sm space-y-2 text-gray-300 border-t border-gray-700 pt-3">
        <p className="flex items-center gap-2"><Calendar size={14} /> {format(startTime, "dd/MM/yy", { locale: ptBR })}</p>
        <p className="flex items-center gap-2"><Clock size={14} /> {format(startTime, "HH:mm")}</p>
        <div className="flex items-start gap-2">
          <Scissors size={14} className="mt-0.5"/>
          <div>
            {services.map(s => s.name).join(', ')}
            <span className="text-xs text-gray-500 ml-1">({appointment.totalDuration} min)</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => onReject(appointment.id, 'cancelled')} className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/40 font-semibold text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1">
          <X size={16} /> Recusar
        </button>
        <button onClick={() => onAccept(appointment.id, 'scheduled')} className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/40 font-semibold text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1">
          <Check size={16} /> Aceitar
        </button>
      </div>
    </motion.div>
  );
};