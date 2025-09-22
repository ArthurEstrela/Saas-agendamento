// src/components/ServiceProvider/Agenda/AppointmentCard.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, User, Scissors, DollarSign } from "lucide-react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";

export const AppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedProviderAppointment;
}) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();

  const handleCardClick = () => {
    setSelectedAppointment(appointment); // Ação para abrir o modal de detalhes
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="bg-gray-900 p-4 rounded-lg border border-gray-800 cursor-pointer shadow-lg hover:border-amber-500/30 transition-colors duration-200"
    >
      {/* Cabeçalho com Horário e Duração */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-800">
        <p className="font-bold text-md text-white">
          {format(appointment.startTime, "HH:mm")}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          <span>{appointment.totalDuration} min</span>
        </div>
      </div>

      {/* Corpo com Serviço e Cliente */}
      <div className="py-3">
        <p className="font-semibold text-white truncate flex items-center gap-2 text-sm">
          <Scissors size={14} className="text-amber-400 flex-shrink-0" />
          <span className="truncate">
            {appointment.services.map((s) => s.name).join(", ")}
          </span>
        </p>
        <p className="text-sm text-gray-400 flex items-center gap-2 mt-2">
          <User size={14} className="flex-shrink-0" />
          {appointment.client?.name || "Cliente não identificado"}
        </p>
      </div>

      {/* Rodapé com Preço */}
      <div className="flex justify-end items-center pt-3 border-t border-gray-800">
        <p className="font-bold text-amber-500 text-md flex items-center gap-1">
          <DollarSign size={14} />
          {appointment.totalPrice.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
};
