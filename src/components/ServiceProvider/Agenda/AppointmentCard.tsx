// src/components/ServiceProvider/Agenda/AppointmentCard.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { format, isPast } from "date-fns"; // isPast ajuda a decidir a mensagem
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock, User, Scissors, DollarSign, MessageCircle } from "lucide-react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";

export const AppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedProviderAppointment;
}) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();
  const { client, startTime, services } = appointment;

  // Handler para abrir o Modal de detalhes (clique no card)
  const handleCardClick = () => {
    setSelectedAppointment(appointment); 
  };

  // Handler para o WhatsApp (clique no botão)
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // CRUCIAL: Impede que o modal abra ao clicar no Zap

    if (!client?.phone) return;

    const cleanPhone = client.phone.replace(/\D/g, '');
    const serviceName = services[0]?.name || "serviço";
    
    // Lógica Inteligente de Mensagem:
    let message = "";
    
    if (isPast(startTime)) {
      // Passado: Re-engajamento / Saudade
      message = `Olá ${client.name}, faz tempo que não te vejo! Bora marcar aquele ${serviceName}?`;
    } else {
      // Futuro: Confirmação / Contato
      const timeString = format(startTime, "HH:mm");
      message = `Olá ${client.name}, passando para confirmar nosso agendamento de ${serviceName} às ${timeString}.`;
    }

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="bg-gray-900 p-4 rounded-lg border border-gray-800 cursor-pointer shadow-lg hover:border-amber-500/30 transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        {/* Cabeçalho com Horário e Duração */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <p className="font-bold text-md text-white">
            {format(startTime, "HH:mm")}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>{appointment.totalDuration} min</span>
          </div>
        </div>

        {/* Corpo com Serviço e Cliente */}
        <div className="py-3 space-y-2">
          <p className="font-semibold text-white truncate flex items-center gap-2 text-sm">
            <Scissors size={14} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">
              {services.map((s) => s.name).join(", ")}
            </span>
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <User size={14} className="flex-shrink-0" />
            <span className="truncate">
                {client?.name || "Cliente não identificado"}
            </span>
          </p>
        </div>
      </div>

      {/* Rodapé com Ação (Zap) e Preço */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-800 mt-1">
        
        {/* Botão WhatsApp (Esquerda) */}
        {client?.phone ? (
          <button
            onClick={handleWhatsAppClick}
            className="p-1.5 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-500/10 transition-colors z-20"
            title="Enviar mensagem"
          >
            <MessageCircle size={18} />
          </button>
        ) : (
          <div className="w-8" /> // Espaçador vazio para manter alinhamento se não tiver fone
        )}

        {/* Preço (Direita) */}
        <p className="font-bold text-amber-500 text-md flex items-center gap-1">
          <DollarSign size={14} />
          {appointment.totalPrice.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
};