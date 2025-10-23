// src/components/ServiceProvider/Agenda/ScheduledAppointmentCard.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Scissors, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils/cn"; // ****** ADICIONADO ******

interface CardProps {
  appointment: EnrichedProviderAppointment;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const ScheduledAppointmentCard = ({
  appointment,
  onAppointmentSelect,
}: CardProps) => {
  // Lógica de UI
  const isServiceTimePast = isPast(appointment.endTime); // ****** ADICIONADO: Verifica se está pendente ******
  const isPending = appointment.status === "pending"; // **************************************************
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onAppointmentSelect(appointment)} // ****** CLASSES CONDICIONAIS (cn) ADICIONADAS ******
      className={cn(
        `bg-gray-800/50 border border-gray-700 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:border-amber-500/50`,
        isPending &&
          "border-l-4 border-l-amber-500 bg-amber-900/10 hover:border-amber-500/70",
        !isPending && isServiceTimePast && "opacity-70"
      )} // ******************************************************
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-white">{appointment.client?.name}</p>
          <p className="text-sm text-gray-400">
            com {appointment.professionalName}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white">
            {format(appointment.startTime, "HH:mm")}
          </p>
          <p className="text-xs text-gray-500">
            {format(appointment.startTime, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="border-t border-gray-700 my-3"></div>
      <div className="space-y-2 text-sm text-gray-300">
        <p className="flex items-start gap-2">
          <Scissors size={16} className="text-amber-400 mt-0.5" />
          <span>{appointment.services.map((s) => s.name).join(", ")}</span>
        </p>
        <p className="flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          <span>Duração: {appointment.totalDuration} min</span>
        </p>
      </div>
      {/* ****** INDICADOR VISUAL DINÂMICO ****** */}
      {(isServiceTimePast || isPending) && (
        <div className="mt-4 pt-3 border-t border-gray-700/50">
          {isPending ? (
            <p className="text-xs text-amber-400/80 flex items-center justify-center gap-1.5">
              <Clock size={14} /> Aguardando sua confirmação.
            </p>
          ) : (
            <p className="text-xs text-green-400/80 flex items-center justify-center gap-1.5">
              <CheckCircle size={14} /> Horário finalizado. Clique para
              concluir.
            </p>
          )}
        </div>
      )}
      {/* ***************************************** */}
    </motion.div>
  );
};
