import type { Appointment } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building, Scissors, Calendar, Clock, Star } from 'lucide-react';

interface ClientAppointmentCardProps {
  appointment: Appointment;
  onReview: (appointment: Appointment) => void; // Função para abrir o modal de avaliação
}

// Mapeia o status para estilos visuais
const statusStyles = {
  pending: { borderColor: 'border-yellow-500', textColor: 'text-yellow-400', text: 'Pendente' },
  scheduled: { borderColor: 'border-green-500', textColor: 'text-green-400', text: 'Confirmado' },
  completed: { borderColor: 'border-blue-500', textColor: 'text-blue-400', text: 'Concluído' },
  cancelled: { borderColor: 'border-red-500', textColor: 'text-red-400', text: 'Cancelado' },
};

export const ClientAppointmentCard = ({ appointment, onReview }: ClientAppointmentCardProps) => {
  const style = statusStyles[appointment.status] || statusStyles.pending;
  const appointmentDate = new Date(appointment.startTime);

  return (
    <div className={`bg-black/30 rounded-2xl p-5 border-l-4 ${style.borderColor} flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white mb-2">{appointment.serviceName}</h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${style.textColor} bg-gray-800`}>
            {style.text}
          </span>
        </div>

        <div className="space-y-2 text-gray-400">
          <p className="flex items-center gap-2 text-sm"><Building size={16} /> {appointment.professionalName}</p>
          <p className="flex items-center gap-2 text-sm"><Calendar size={16} /> {format(appointmentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <p className="flex items-center gap-2 text-sm"><Clock size={16} /> {format(appointmentDate, "HH:mm")}</p>
        </div>
      </div>

      {/* Botão de Avaliação */}
      {appointment.status === 'completed' && !appointment.review && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <button 
            onClick={() => onReview(appointment)}
            className="w-full secondary-button flex items-center justify-center gap-2"
          >
            <Star size={16}/> Avaliar Serviço
          </button>
        </div>
      )}
    </div>
  );
};