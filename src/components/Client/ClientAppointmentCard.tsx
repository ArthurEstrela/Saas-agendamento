// src/components/Client/ClientAppointmentCard.tsx

import React from 'react';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Tag, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Função para obter o ícone e a cor do status
const getStatusProps = (status: 'confirmed' | 'pending' | 'cancelled') => {
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

const ClientAppointmentCard = ({ booking }: { booking: Booking }) => {
  const { icon, color, label } = getStatusProps(booking.status);
  const bookingDate = new Date(booking.date);

  return (
    <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Informações do Prestador e Data */}
        <div className="flex items-center gap-4">
           {/* Idealmente, teríamos a foto do prestador aqui. Usando um fallback por enquanto. */}
           <div className="h-16 w-16 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center border-2 border-gray-600">
               <span className="text-2xl font-bold text-[#daa520]">{booking.clientName.charAt(0).toUpperCase()}</span>
           </div>
          <div>
            <h3 className="text-xl font-bold text-white">{booking.professionalName}</h3>
            <div className="flex items-center gap-4 text-gray-400 mt-1">
              <span className="flex items-center gap-2 text-sm"><Calendar size={14} /> {format(bookingDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              <span className="flex items-center gap-2 text-sm"><Clock size={14} /> {format(bookingDate, "HH:mm")}</span>
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className={`flex items-center gap-2 font-semibold text-sm px-3 py-1 rounded-full ${color} bg-opacity-10`}>
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

      {/* Ações (ex: Cancelar, Reagendar) podem ser adicionadas aqui no futuro */}
       {booking.status !== 'cancelled' && new Date() < bookingDate && (
         <div className="mt-4 flex justify-end">
             <button className="text-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 px-4 py-2 rounded-lg transition-colors">
                 Cancelar Agendamento
             </button>
         </div>
       )}
    </div>
  );
};

export default ClientAppointmentCard;