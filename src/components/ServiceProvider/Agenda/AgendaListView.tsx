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

// UI
import { Button } from "../../ui/button";

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden",
        "bg-gray-900/60 border-gray-800/50 backdrop-blur-sm",
        "hover:bg-gray-800/80 hover:border-primary/20",
        isPending && "bg-yellow-500/5 border-yellow-500/30 hover:bg-yellow-500/10"
      )}
    >
      {/* Indicador lateral colorido */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 sm:w-1.5",
          isPending ? "bg-yellow-500" : "bg-primary"
        )} 
      />

      {/* Coluna de Tempo (Largura fixa reduzida no mobile) */}
      <div className="flex flex-col items-center justify-center w-12 sm:w-16 shrink-0 border-r border-gray-800 pr-2 sm:pr-3 my-0.5">
        <span className="font-bold text-base sm:text-xl text-gray-100 font-mono tracking-tighter">
          {format(appointment.startTime, "HH:mm")}
        </span>
        <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase text-center leading-tight">
            Até<br/>{format(appointment.endTime, "HH:mm")}
        </span>
      </div>

      {/* Info Principal (min-w-0 é crucial para o truncate funcionar no flex) */}
      <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5 sm:gap-1.5">
        {/* Serviços */}
        <div className="flex items-center gap-1.5">
          <Scissors size={12} className="text-primary shrink-0 sm:w-3.5 sm:h-3.5" />
          <span className="font-semibold text-xs sm:text-sm text-gray-200 truncate leading-tight">
            {appointment.services.map((s) => s.name).join(", ")}
          </span>
        </div>
        
        {/* Cliente */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <User size={12} className="shrink-0 sm:w-[13px] sm:h-[13px]" />
          <span className="truncate font-medium text-[11px] sm:text-xs">
            {appointment.client?.name || "Cliente sem cadastro"}
          </span>
        </div>

        {/* Status Mobile (Só aparece se pendente) */}
        {isPending && (
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-yellow-500 font-bold mt-0.5 animate-pulse">
            <AlertCircle size={10} />
            AGUARDANDO
          </div>
        )}
      </div>

      {/* Coluna da Direita: Preço + Seta */}
      <div className="flex flex-col items-end justify-center shrink-0 gap-1 pl-1">
        <span className="font-bold text-white text-xs sm:text-base bg-gray-800/50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md whitespace-nowrap">
          R$ {appointment.totalPrice.toFixed(0)}
        </span>
        
        {/* Indicador visual de 'clique para ver mais' */}
        <ChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors sm:w-4 sm:h-4" />
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
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-fade-in px-4 text-center">
        <div className="bg-gray-800/50 p-4 rounded-full mb-4">
            <Clock size={40} className="opacity-40" />
        </div>
        <p className="text-base font-medium">Nenhum agendamento aqui.</p>
        <p className="text-xs opacity-60">Aproveite o tempo livre!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full"> 
      <ul className="space-y-2 sm:space-y-3 pb-4 w-full">
        <AnimatePresence mode="popLayout">
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
        <div className="mt-auto flex justify-center items-center gap-3 sm:gap-4 py-4 mb-10 sm:mb-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-gray-700 bg-gray-800 hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs sm:text-sm font-medium text-gray-400">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-gray-700 bg-gray-800 hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};