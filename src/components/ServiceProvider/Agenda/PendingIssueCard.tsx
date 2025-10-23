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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../ui/button"; // Vamos adicionar um botão de ação direto

interface CardProps {
  appointment: EnrichedProviderAppointment;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const PendingIssueCard = ({
  appointment,
  onAppointmentSelect,
}: CardProps) => {
  // Calcula há quanto tempo deveria ter sido concluído
  const timeAgo = formatDistanceToNow(appointment.endTime, {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Estilo de urgência: borda amarela/vermelha
      className="bg-gray-800/50 border border-yellow-700/50 rounded-xl p-4 transition-all duration-300 hover:border-yellow-500/70 shadow-lg shadow-black/30"
    >
      {/* Header com o Alerta */}
      <div className="flex justify-between items-center pb-3 border-b border-yellow-700/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
          <div>
            <p className="font-bold text-lg text-yellow-400">
              Pendente de Conclusão
            </p>
            <p className="text-sm text-gray-300">
              Finalizado {timeAgo}
            </p>
          </div>
        </div>
        {/* Botão de Ação Rápida */}
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => onAppointmentSelect(appointment)}
        >
          Concluir Agora
        </Button>
      </div>

      {/* Detalhes do Agendamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 text-sm">
        <p className="flex items-center gap-2 text-gray-300">
          <Calendar size={16} className="text-gray-500" />
          <span className="font-semibold">
            {format(appointment.startTime, "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <User size={16} className="text-gray-500" />
          Cliente:{" "}
          <span className="font-semibold text-white">
            {appointment.client?.name}
          </span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <Scissors size={16} className="text-gray-500" />
          Serviço:{" "}
          <span className="font-semibold text-white truncate">
            {appointment.services.map((s) => s.name).join(", ")}
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