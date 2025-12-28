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
  MoreHorizontal
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
      whileTap={{ scale: 0.98 }} // Feedback tátil no mobile
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        "bg-gray-900/40 border-gray-800 hover:bg-gray-800/60 hover:border-primary/30",
        isPending &&
          "border-l-4 border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10"
      )}
    >
      {/* Coluna de Tempo */}
      <div className="flex flex-col items-center justify-center text-center min-w-[4rem] sm:min-w-[5rem] shrink-0">
        <span className="font-bold text-lg sm:text-xl text-gray-100 group-hover:text-white leading-none font-mono">
          {format(appointment.startTime, "HH:mm")}
        </span>
        <span className="text-[10px] sm:text-xs text-gray-500 mt-1">
          até {format(appointment.endTime, "HH:mm")}
        </span>

        <div className="mt-2">
          {isPending ? (
            <Badge variant="warning" className="text-[10px] px-1.5 h-5 gap-1 shadow-none">
              <AlertCircle size={10} /> 
              <span className="hidden sm:inline">Pendente</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 h-5 bg-gray-800 text-gray-400 border-gray-700 shadow-none"
            >
              <Clock size={10} className="mr-1" /> {appointment.totalDuration}m
            </Badge>
          )}
        </div>
      </div>

      <div className="w-px bg-gray-800 h-10 mx-1 hidden sm:block" />

      {/* Info Principal */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <Scissors size={14} className="text-primary shrink-0" />
          <span className="font-semibold text-sm sm:text-base text-gray-200 truncate group-hover:text-primary transition-colors">
            {appointment.services.map((s) => s.name).join(", ")}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
          <User size={13} className="shrink-0" />
          <span className="truncate">
            {appointment.client?.name || "Cliente sem nome"}
          </span>
        </div>

        {/* Info extra (Profissional) no Mobile apenas se houver espaço */}
        <div className="flex sm:hidden mt-1 items-center gap-1 text-[10px] text-gray-500">
           <span className="truncate max-w-[120px]">{appointment.professionalName}</span>
        </div>
      </div>

      {/* Preço e Profissional (Desktop) */}
      <div className="text-right flex flex-col items-end shrink-0 pl-2">
        <span className="font-bold text-primary text-base sm:text-lg flex items-center gap-0.5">
          <span className="text-[10px] sm:text-xs text-gray-500 font-normal mr-0.5">R$</span>
          {appointment.totalPrice.toFixed(2)}
        </span>
        
        {/* Profissional visível apenas em Desktop aqui */}
        <span className="text-xs text-gray-500 mt-1 max-w-[100px] truncate hidden sm:block">
          {appointment.professionalName}
        </span>
        
        {/* Ícone de "Mais" no mobile para indicar que é clicável */}
        <MoreHorizontal size={16} className="text-gray-600 sm:hidden mt-2" />
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
        <p className="text-lg">Nenhum agendamento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ul className="space-y-2 sm:space-y-3 pb-4">
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
        <div className="mt-auto flex justify-center items-center gap-4 pt-4 pb-2 border-t border-gray-800">
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