// src/components/ServiceProvider/Agenda/AgendaListView.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Users, Clock, User, Scissors, DollarSign } from "lucide-react";
import { cn } from "../../../lib/utils/cn"; // ****** ADICIONADO ******

const AppointmentRow = ({
  appointment,
  onClick,
}: {
  appointment: EnrichedProviderAppointment;
  onClick: () => void;
}) => {
  // ****** ADICIONADO: Verifica se está pendente ******
  const isPending = appointment.status === "pending"; // **************************************************
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick} // ****** CLASSES CONDICIONAIS (cn) ADICIONADAS ******
      className={cn(
        "flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800/50 hover:border-amber-500/20 transition-all duration-200 cursor-pointer",
        isPending &&
          "border-l-4 border-l-amber-500 bg-amber-900/10 hover:border-amber-500/40"
      )} // ******************************************************
    >
      <div className="flex flex-col items-center justify-center text-center w-24 flex-shrink-0">
        <p className="font-bold text-lg text-white">
          {format(appointment.startTime, "HH:mm")}
        </p>
        <p className="text-xs text-gray-400">
          às {format(appointment.endTime, "HH:mm")}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Clock size={12} />
          <span>{appointment.totalDuration} min</span>
        </div>
        {/* ****** BADGE PENDENTE ADICIONADO ****** */}
        {isPending && (
          <span className="mt-2 text-xs font-semibold text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full">
            Pendente
          </span>
        )}
        {/* *************************************** */}
      </div>
      <div className="w-px bg-gray-700 h-12"></div>
      <div className="flex-grow">
        <p className="font-semibold text-white truncate flex items-center gap-2">
          <Scissors size={14} className="text-amber-400" />
          {appointment.services.map((s) => s.name).join(", ")}
        </p>
        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
          <User size={14} />
          {appointment.client?.name}
        </p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="font-bold text-amber-500 text-lg flex items-center gap-1">
          <DollarSign size={16} /> D{appointment.totalPrice.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {appointment.professionalName}
        </p>
      </div>
    </motion.li>
  );
};

export const AgendaListView = ({
  appointments,
  onAppointmentSelect,
}: {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
}) => {
  // Não precisamos ordenar aqui se já está ordenado em AgendaView
  // const sortedAppointments = [...appointments].sort(
  // (a, b) => a.startTime.getTime() - b.startTime.getTime()
  // );

  // A verificação de "vazio" foi movida para o AgendaView.tsx
  // para consistência entre as views de card e lista.

  return (
    <ul className="space-y-3">
      {appointments.map((appt) => (
        <AppointmentRow
          key={appt.id}
          appointment={appt}
          onClick={() => onAppointmentSelect(appt)}
        />
      ))}
    </ul>
  );
};
