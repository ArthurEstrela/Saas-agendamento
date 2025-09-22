// src/components/ServiceProvider/Agenda/ScheduledAppointmentCard.tsx
import { useState } from 'react';
import type { EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore';
import { useProviderAppointmentsStore } from '../../../store/providerAppointmentsStore';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Calendar, Clock, Scissors, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ServiceCompletionModal } from '../ServiceCompletionModal'; // <-- O modal que você já tem!

interface CardProps {
  appointment: EnrichedProviderAppointment;
}

export const ScheduledAppointmentCard = ({ appointment }: CardProps) => {
  const { completeAppointment } = useProviderAppointmentsStore();
  const [isCompletionModalOpen, setCompletionModalOpen] = useState(false);

  // Verifica se o horário final do agendamento já passou
  const isServiceTimePast = isPast(appointment.endTime);

  const handleConfirmCompletion = async (finalPrice: number) => {
    await completeAppointment(appointment.id, finalPrice);
    setCompletionModalOpen(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 transition-all duration-300 ${isServiceTimePast ? 'border-amber-500/50' : ''}`}
      >
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-white">{appointment.client?.name}</p>
                <p className="text-sm text-gray-400">com {appointment.professionalName}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-white">{format(appointment.startTime, "HH:mm")}</p>
                <p className="text-xs text-gray-500">{format(appointment.startTime, "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
        </div>

        <div className="border-t border-gray-700 my-3"></div>

        <div className="space-y-2 text-sm text-gray-300">
            <p className="flex items-start gap-2">
                <Scissors size={16} className="text-amber-400 mt-0.5" />
                <span>{appointment.services.map(s => s.name).join(', ')}</span>
            </p>
            <p className="flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span>Duração: {appointment.totalDuration} min</span>
            </p>
        </div>

        {isServiceTimePast && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={() => setCompletionModalOpen(true)}
              className="w-full bg-green-500/20 text-green-300 font-bold py-2 px-4 rounded-lg hover:bg-green-500/40 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Concluir Serviço
            </button>
          </div>
        )}
      </motion.div>

      <ServiceCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        initialPrice={appointment.totalPrice}
        isLoading={false} // Pode ser conectado a um estado de loading se necessário
      />
    </>
  );
};