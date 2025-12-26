import { useState, useMemo, useEffect } from "react";
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  User,
  Scissors,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils/cn";

// Componentes Primitivos
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const ITEMS_PER_PAGE = 10;

const AppointmentRow = ({
  appointment,
  onClick,
}: {
  appointment: EnrichedProviderAppointment;
  onClick: () => void;
}) => {
  const isPending = appointment.status === "pending";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        "bg-gray-900/40 border-gray-800 hover:bg-gray-800/60 hover:border-primary/30",
        isPending &&
          "border-l-4 border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10"
      )}
    >
      {/* Coluna de Tempo */}
      <div className="flex flex-col items-center justify-center text-center min-w-[5rem] shrink-0">
        <span className="font-bold text-xl text-gray-100 group-hover:text-white leading-none">
          {format(appointment.startTime, "HH:mm")}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          até {format(appointment.endTime, "HH:mm")}
        </span>

        <div className="mt-2">
          {isPending ? (
            <Badge variant="warning" className="text-[10px] px-1.5 h-5 gap-1">
              <AlertCircle size={10} /> Pendente
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 h-5 bg-gray-800 text-gray-400 border-gray-700"
            >
              <Clock size={10} className="mr-1" /> {appointment.totalDuration}m
            </Badge>
          )}
        </div>
      </div>

      <div className="w-px bg-gray-800 h-10 mx-2 hidden sm:block" />

      {/* Info Principal */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Scissors size={14} className="text-primary shrink-0" />
          <span className="font-semibold text-gray-200 truncate group-hover:text-primary transition-colors">
            {appointment.services.map((s) => s.name).join(", ")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User size={14} />
          <span className="truncate">
            {appointment.client?.name || "Cliente sem nome"}
          </span>
        </div>
      </div>

      {/* Preço e Profissional */}
      <div className="text-right flex flex-col items-end shrink-0 pl-2">
        <span className="font-bold text-primary text-lg flex items-center gap-0.5">
          <span className="text-xs text-gray-500 font-normal mr-0.5">R$</span>
          {appointment.totalPrice.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500 mt-1 max-w-[100px] truncate hidden sm:block">
          {appointment.professionalName}
        </span>
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
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [appointments]);

  const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return appointments.slice(startIndex, endIndex);
  }, [appointments, currentPage]);

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Clock size={48} className="mb-4 opacity-20" />
        <p>Nenhum agendamento encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        <AnimatePresence mode="wait">
          {paginatedAppointments.map((appt) => (
            <AppointmentRow
              key={appt.id}
              appointment={appt}
              onClick={() => onAppointmentSelect(appt)}
            />
          ))}
        </AnimatePresence>
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-8 pb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-9 w-9 border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-gray-400 min-w-[100px] text-center">
            Página <span className="text-white">{currentPage}</span> de{" "}
            {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
