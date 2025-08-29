// src/components/Client/ClientAppointmentCard.tsx

import React from 'react';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { 
    Calendar, 
    Clock, 
    Tag, 
    DollarSign, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Star
} from 'lucide-react';

// --- Helper para converter data (Timestamp, string, etc.) para Date ---
const convertToDate = (date: any): Date => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  return new Date(date);
};

// --- Helper para o Status ---
const getStatusProps = (status: Booking['status']) => {
  switch (status) {
    case 'confirmed':
      return { icon: <CheckCircle size={16} />, color: 'text-green-400', label: 'Confirmado' };
    case 'cancelled':
      return { icon: <XCircle size={16} />, color: 'text-red-400', label: 'Cancelado' };
    case 'pending':
    default:
      return { icon: <AlertCircle size={16} />, color: 'text-yellow-400', label: 'Pendente' };
  }
};

// --- Props do Componente ---
interface ClientAppointmentCardProps {
  booking: Booking;
  // Funções recebidas do ClientDashboard
  onCancel: (bookingId: string) => void;
  onReview: (booking: Booking) => void;
}

const ClientAppointmentCard = ({ booking, onCancel, onReview }: ClientAppointmentCardProps) => {
  const { icon, color, label } = getStatusProps(booking.status);
  const bookingDate = convertToDate(booking.date);
  const isPast = new Date() > bookingDate;

  // Assume que o objeto booking foi enriquecido com os dados do prestador.
  // Isso é uma ótima prática de performance para evitar buscas repetidas no banco.
  const providerName = booking.professionalName || 'Prestador de Serviço';
  const providerPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=1f2937&color=daa520`;

  return (
    <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Informações do Prestador e Data */}
        <div className="flex items-center gap-4 flex-grow">
          <img 
            src={providerPhoto} 
            alt={providerName}
            className="h-16 w-16 rounded-full object-cover border-2 border-gray-600 flex-shrink-0"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{providerName}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-gray-400 mt-1">
              <span className="flex items-center gap-2 text-sm">
                <Calendar size={14} /> {format(bookingDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Clock size={14} /> {format(bookingDate, "HH:mm")}h
              </span>
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className={`flex items-center gap-2 font-semibold text-sm px-3 py-1 rounded-full ${color} bg-current/10 flex-shrink-0`}>
          {icon}
          <span>{label}</span>
        </div>
      </div>

      <div className="border-t border-gray-700 my-4"></div>
      
      {/* Detalhes dos Serviços e Preço */}
      <div className="space-y-3">
        <h4 className="font-semibold text-white flex items-center gap-2"><Tag size={16}/> Serviços</h4>
        {booking.services.map(service => (
          <div key={service.id} className="flex justify-between items-center text-gray-300 text-sm">
            <span>{service.name}</span>
            <span className="font-mono">R$ {service.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 my-4"></div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-white flex items-center gap-2"><DollarSign size={18}/> Valor Total</span>
        <span className="text-2xl font-bold text-[#daa520]">R$ {booking.totalPrice.toFixed(2)}</span>
      </div>

      {/* Ações Condicionais (Cancelar / Avaliar) */}
      <div className="mt-4 flex justify-end gap-3">
        {!isPast && booking.status === 'confirmed' && (
          <button 
            onClick={() => onCancel(booking.id)}
            className="text-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            Cancelar Agendamento
          </button>
        )}
        
        {isPast && booking.status === 'confirmed' && !booking.reviewId && (
           <button 
             onClick={() => onReview(booking)}
             className="text-sm bg-[#daa520]/20 text-[#daa520] hover:bg-[#daa520]/40 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2"
           >
             <Star size={14}/> Avaliar Serviço
           </button>
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentCard;
