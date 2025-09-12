import type { Appointment } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Scissors, Check, X } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdateStatus: (id: string, status: 'scheduled' | 'cancelled') => void;
}

// Mapeia o status para cores e textos específicos
const statusStyles = {
  pending: {
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    text: 'Pendente de Confirmação',
  },
  scheduled: {
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    text: 'Confirmado',
  },
  completed: {
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    text: 'Concluído',
  },
  cancelled: {
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    text: 'Cancelado',
  },
};

export const AppointmentCard = ({ appointment, onUpdateStatus }: AppointmentCardProps) => {
  const style = statusStyles[appointment.status] || statusStyles.pending;
  const startTime = format(new Date(appointment.startTime), 'HH:mm');
  const endTime = format(new Date(appointment.endTime), 'HH:mm');

  return (
    <div className={`p-5 rounded-2xl border-l-4 ${style.borderColor} ${style.bgColor} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
      <div className="flex-1 space-y-3">
        {/* Hora, Cliente e Serviço */}
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-lg font-bold text-white">
            <Clock size={18} /> {startTime} - {endTime}
          </span>
          <span className="flex items-center gap-2 text-gray-300">
            <User size={16} /> {appointment.clientName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 pl-1">
          <Scissors size={16} /> {appointment.serviceName}
        </div>
      </div>

      {/* Status e Ações */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${style.bgColor} ${style.textColor}`}>
          {style.text}
        </span>

        {/* Mostra os botões de ação apenas se o agendamento estiver pendente */}
        {appointment.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
              className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
              title="Cancelar Agendamento"
            >
              <X size={18} />
            </button>
            <button 
              onClick={() => onUpdateStatus(appointment.id, 'scheduled')}
              className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"
              title="Confirmar Agendamento"
            >
              <Check size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};