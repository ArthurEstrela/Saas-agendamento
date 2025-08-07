// src/components/Client/ClientAppointmentCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, History, XCircle, Clock, Star } from 'lucide-react';
import type { Appointment } from '../../types'; // Ajuste o caminho conforme a localização real dos tipos

interface ClientAppointmentCardProps {
  app: Appointment;
  handleOpenReviewModal: (appointment: Appointment) => void;
  handleCancelAppointment: (appointmentId: string) => void;
}

const ClientAppointmentCard: React.FC<ClientAppointmentCardProps> = ({
  app,
  handleOpenReviewModal,
  handleCancelAppointment,
}) => {
  const getStatusInfo = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return { text: 'Confirmado', color: 'text-green-400', icon: <CheckCircle size={16} /> };
      case 'completed': return { text: 'Concluído', color: 'text-blue-400', icon: <History size={16} /> };
      case 'cancelled':
      case 'no-show': return { text: 'Cancelado', color: 'text-red-400', icon: <XCircle size={16} /> };
      default: return { text: 'Pendente', color: 'text-yellow-400', icon: <Clock size={16} /> };
    }
  };
  const statusInfo = getStatusInfo(app.status);

  // Cria a data no fuso horário local para exibição
  const [year, month, day] = app.date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day); // Mês é 0-indexado

  return (
    <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:border-[#daa520]/50 hover:shadow-lg hover:shadow-[#daa520]/5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400">{format(localDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <p className="text-2xl font-bold text-white">{app.time}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-black/20 ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
      </div>
      <div className="border-t border-gray-700 my-4"></div>
      <div>
        <p className="font-bold text-lg text-white">{app.establishmentName}</p>
        <p className="text-gray-300">{app.serviceName}</p>
        <p className="text-sm text-gray-400">com {app.professionalName}</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {/* Condição para exibir o botão "Avaliar" ou o status "Avaliado" */}
        {app.status === 'completed' && app.hasBeenReviewed ? (
          <span className="text-blue-400 font-bold py-2 px-4 text-sm rounded-lg flex items-center gap-1">
            <Star size={16} /> Avaliado
          </span>
        ) : (
          app.status === 'completed' && !app.hasBeenReviewed && (
            <button onClick={() => handleOpenReviewModal(app)} className="bg-[#daa520] text-black font-bold py-2 px-4 text-sm rounded-lg flex items-center gap-1 hover:bg-[#c8961e] transition-colors">
              <Star size={16} /> Avaliar
            </button>
          )
        )}
        {/* Botão de Cancelar */}
        {(app.status === 'pending' || app.status === 'confirmed') && (
          <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 text-sm rounded-lg transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentCard;
