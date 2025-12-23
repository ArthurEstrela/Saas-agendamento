// src/components/ServiceProvider/Agenda/PendingIssueCard.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  User,
  Scissors,
  DollarSign,
  MessageCircle // Ícone do Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../ui/button";

interface CardProps {
  appointment: EnrichedProviderAppointment;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const PendingIssueCard = ({
  appointment,
  onAppointmentSelect,
}: CardProps) => {
  const { client, startTime, services } = appointment;

  // Calcula há quanto tempo deveria ter sido concluído
  const timeAgo = formatDistanceToNow(appointment.endTime, {
    addSuffix: true,
    locale: ptBR,
  });

  // --- Lógica do WhatsApp ---
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!client?.phoneNumber) return;

    const cleanPhone = client.phoneNumber.replace(/\D/g, '');
    const dateString = format(startTime, "dd/MM", { locale: ptBR });
    const timeString = format(startTime, "HH:mm");
    
    // Mensagem contextual para "Pendência":
    // Pode ser usada para cobrar pagamento pendente ou apenas confirmar que deu tudo certo.
    const message = `Olá ${client.name}, sobre nosso agendamento de ${dateString} às ${timeString}. Tudo certo por aí?`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };
  // --------------------------

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 border border-yellow-700/50 rounded-xl p-4 transition-all duration-300 hover:border-yellow-500/70 shadow-lg shadow-black/30"
    >
      {/* Header com o Alerta e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-yellow-700/30">
        
        {/* Ícone e Texto de Alerta */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
          <div>
            <p className="font-bold text-lg text-yellow-400 leading-tight">
              Pendente de Conclusão
            </p>
            <p className="text-sm text-gray-300">
              Finalizado {timeAgo}
            </p>
          </div>
        </div>

        {/* Grupo de Botões de Ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Botão WhatsApp (Só aparece se tiver telefone) */}
          {client?.phoneNumber && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-600/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500 flex-1 sm:flex-none"
              onClick={handleWhatsAppClick}
              title="Entrar em contato"
            >
              <MessageCircle size={18} className="mr-1" />
              <span className="sm:hidden lg:inline">Contato</span> {/* Texto responsivo */}
            </Button>
          )}

          {/* Botão Concluir */}
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shadow-md shadow-green-900/20"
            onClick={() => onAppointmentSelect(appointment)}
          >
            Concluir Agora
          </Button>
        </div>

      </div>

      {/* Detalhes do Agendamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 text-sm">
        <p className="flex items-center gap-2 text-gray-300">
          <Calendar size={16} className="text-gray-500" />
          <span className="font-semibold">
            {format(startTime, "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <User size={16} className="text-gray-500" />
          Cliente:{" "}
          <span className="font-semibold text-white">
            {client?.name || 'Cliente sem nome'}
          </span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <Scissors size={16} className="text-gray-500" />
          Serviço:{" "}
          <span className="font-semibold text-white truncate">
            {services.map((s) => s.name).join(", ")}
          </span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <DollarSign size={16} className="text-gray-500" />
          Valor:{" "}
          <span className="font-semibold text-amber-500">
            R$ {appointment.totalPrice.toFixed(2)}
          </span>
        </p>
      </div>
    </motion.div>
  );
};