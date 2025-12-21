// src/components/ServiceProvider/AppointmentRequestCard.tsx
import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Calendar, Clock, Scissors, Check, X, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentRequestCardProps {
  appointment: EnrichedProviderAppointment;
  onAccept: (id: string, status: 'scheduled') => void;
  onReject: (id: string, status: 'cancelled') => void;
}

export const AppointmentRequestCard = ({ appointment, onAccept, onReject }: AppointmentRequestCardProps) => {
  const { client, startTime, services, professionalName } = appointment;

  // Lógica do WhatsApp adicionada
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita cliques acidentais em outros elementos
    
    // Garante que temos um telefone antes de tentar abrir
    if (!client?.phone) return;

    const cleanPhone = client.phone.replace(/\D/g, '');
    
    // Formatação amigável para a mensagem
    const dateString = format(startTime, "dd/MM", { locale: ptBR });
    const timeString = format(startTime, "HH:mm");

    const message = `Olá ${client.name}, vi sua solicitação para ${dateString} às ${timeString}. Posso confirmar ou prefere outro horário?`;
    
    // DDI 55 hardcoded para Brasil (ajuste se necessário)
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 mb-4 relative"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
          {client?.profilePictureUrl ? (
            <img src={client.profilePictureUrl} alt={client.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Nome e Info */}
        <div className="flex-1">
          <h4 className="font-bold text-white">{client?.name || 'Cliente'}</h4>
          <p className="text-xs text-gray-400">com {professionalName}</p>
        </div>

        {/* Botão WhatsApp (NOVO) */}
        {client?.phone && (
          <button 
            onClick={handleWhatsAppClick}
            className="p-2 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500/20 transition-colors"
            title="Negociar horário no WhatsApp"
          >
            <MessageCircle size={20} />
          </button>
        )}
      </div>

      {/* Detalhes do Agendamento */}
      <div className="text-sm space-y-2 text-gray-300 border-t border-gray-700 pt-3">
        <p className="flex items-center gap-2">
            <Calendar size={14} className="text-primary-400" /> 
            {format(startTime, "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <p className="flex items-center gap-2">
            <Clock size={14} className="text-primary-400" /> 
            {format(startTime, "HH:mm")}
        </p>
        <div className="flex items-start gap-2">
          <Scissors size={14} className="mt-0.5 text-primary-400"/>
          <div>
            {services.map(s => s.name).join(', ')}
            <span className="text-xs text-gray-500 ml-1">({appointment.totalDuration} min)</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => onReject(appointment.id, 'cancelled')} 
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/40 font-semibold text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <X size={16} /> Recusar
        </button>
        <button 
          onClick={() => onAccept(appointment.id, 'scheduled')} 
          className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/40 font-semibold text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <Check size={16} /> Aceitar
        </button>
      </div>
    </motion.div>
  );
};