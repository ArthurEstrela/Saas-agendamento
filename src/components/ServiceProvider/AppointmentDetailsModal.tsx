// src/components/ServiceProvider/AppointmentDetailsModal.tsx
import { motion } from 'framer-motion';
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, User, Clock, Scissors, DollarSign, Calendar } from 'lucide-react';

interface ModalProps {
  appointment: EnrichedProviderAppointment;
  onClose: () => void;
}

export const AppointmentDetailsModal = ({ appointment, onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Detalhes do Agendamento</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-300">
            <div className="flex items-center gap-4">
                <img 
                    src={appointment.client?.profilePictureUrl || `https://ui-avatars.com/api/?name=${appointment.client?.name.replace(/\s/g, "+")}`} 
                    alt="Cliente" 
                    className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                    <p className="font-bold text-lg text-white">{appointment.client?.name}</p>
                    <p className="text-sm text-gray-400">com {appointment.professionalName}</p>
                </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 space-y-3">
                <p className="flex items-center gap-3"><Calendar size={16} className="text-[#daa520]" /> {format(appointment.startTime, "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                <p className="flex items-center gap-3"><Clock size={16} className="text-[#daa520]" /> {format(appointment.startTime, "HH:mm")} ({appointment.totalDuration} min)</p>
                <p className="flex items-start gap-3"><Scissors size={16} className="text-[#daa520] mt-1" /> {appointment.services.map(s => s.name).join(', ')}</p>
                <p className="flex items-center gap-3 text-lg font-bold text-white"><DollarSign size={16} className="text-[#daa520]" /> R$ {appointment.totalPrice.toFixed(2)}</p>
            </div>
        </div>

        <div className="mt-6 flex gap-4">
            <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                Fechar
            </button>
        </div>
      </motion.div>
    </div>
  );
};