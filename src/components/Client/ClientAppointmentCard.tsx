// src/components/Client/ClientAppointmentCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, History, XCircle, Clock, Star, CalendarDays, User, Tag, ClipboardList } from 'lucide-react';
import type { Appointment } from '../../types';

// NOVO: Adicionei a nova propriedade `providerPhotoURL`
interface ClientAppointmentCardProps {
  app: Appointment & { providerPhotoURL?: string | null };
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
      case 'confirmed': return { text: 'Confirmado', color: 'text-green-500', icon: <CheckCircle size={16} /> };
      case 'completed': return { text: 'Concluído', color: 'text-blue-500', icon: <History size={16} /> };
      case 'cancelled':
      case 'no-show': return { text: 'Cancelado', color: 'text-red-500', icon: <XCircle size={16} /> };
      default: return { text: 'Pendente', color: 'text-yellow-500', icon: <Clock size={16} /> };
    }
  };
  const statusInfo = getStatusInfo(app.status);

  // Cria a data no fuso horário local para exibição
  const [year, month, day] = app.date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);

  return (
    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm transition-all duration-300 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/5">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-yellow-500 font-bold">
          <CalendarDays size={20} />
          <span className="text-sm">{format(localDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-black/20 ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
      </div>
      
      <div className="flex items-center mb-4">
        {/* NOVO: Imagem do prestador de serviço */}
        <img
          src={app.providerPhotoURL || "https://placehold.co/60x60/1f2937/d1d5db?text=S"}
          alt={`Foto de ${app.establishmentName}`}
          className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-700"
        />
        <div>
          <p className="font-bold text-lg text-white">{app.establishmentName}</p>
          <p className="text-sm text-gray-400">com {app.professionalName}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <ClipboardList size={20} />
          <p className="font-medium">{app.serviceName}</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock size={20} />
          <p className="font-medium">{app.time}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end gap-2">
        {app.status === 'completed' && app.hasBeenReviewed ? (
          <span className="text-blue-500 font-semibold py-2 px-4 text-sm rounded-lg flex items-center gap-1">
            <Star size={16} /> Avaliado
          </span>
        ) : (
          app.status === 'completed' && !app.hasBeenReviewed && (
            <button
              onClick={() => handleOpenReviewModal(app)}
              className="bg-yellow-500 text-gray-900 font-semibold py-2 px-4 text-sm rounded-lg flex items-center gap-1 hover:bg-yellow-400 transition-colors"
            >
              <Star size={16} /> Avaliar
            </button>
          )
        )}
        {(app.status === 'pending' || app.status === 'confirmed') && (
          <button
            onClick={() => handleCancelAppointment(app.id)}
            className="bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-4 text-sm rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentCard;