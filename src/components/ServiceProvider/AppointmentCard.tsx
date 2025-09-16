// src/components/ServiceProvider/AppointmentCard.tsx
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Clock, Scissors, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export const AppointmentCard = ({ appointment }: { appointment: EnrichedProviderAppointment }) => {
  const { client, startTime, services, professionalName, totalPrice, totalDuration } = appointment;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="flex items-start gap-4 p-4 bg-gray-900/70 border border-gray-700 rounded-xl"
    >
      <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
        {client?.profilePictureUrl ? (
          <img src={client.profilePictureUrl} alt={client.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-white">{client?.name || 'Cliente'}</h4>
            <p className="text-xs text-gray-400">com {professionalName}</p>
          </div>
          <div className="text-right">
             <p className="font-bold text-lg text-white flex items-center gap-1"><Clock size={16} className="text-[#daa520]"/> {format(startTime, "HH:mm")}</p>
          </div>
        </div>

        <div className="text-sm mt-3 pt-3 border-t border-gray-700 space-y-2">
          <p className="flex items-center gap-2 text-gray-300">
            <Scissors size={14} className="text-[#daa520]" />
            {services.map(s => s.name).join(', ')}
          </p>
          <div className="flex justify-between items-center text-gray-400">
             <p className="flex items-center gap-2">
                <Clock size={14} />
                {totalDuration} min
            </p>
            <p className="flex items-center gap-2 font-semibold">
                <DollarSign size={14} />
                R$ {totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};